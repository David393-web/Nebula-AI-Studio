const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const bcrypt = require("bcrypt");
const { PasswordResetService, constants } = require("./passwordReset.service");

const originalAppUrl = process.env.APP_URL;
process.env.APP_URL = "https://studio.example.com";

class MemoryResetRepository {
  constructor(users) { this.users = users; this.record = null; }
  async findByUserId(userId) { return this.record?.userId === userId ? { ...this.record } : null; }
  async findByTokenHash(tokenHash) { return this.record?.tokenHash === tokenHash ? { ...this.record } : null; }
  async claimRequest(userId, values, { cooldownBefore, windowBefore, maxRequests }) {
    if (!this.record) {
      this.record = { id: "reset-1", userId, ...values, windowStartedAt: values.requestedAt, requestCount: 1 };
      return true;
    }
    if (this.record.userId !== userId || this.record.requestedAt > cooldownBefore) return false;
    const windowExpired = this.record.windowStartedAt <= windowBefore;
    if (!windowExpired && this.record.requestCount >= maxRequests) return false;
    this.record = { ...this.record, ...values, requestCount: windowExpired ? 1 : this.record.requestCount + 1, windowStartedAt: windowExpired ? values.requestedAt : this.record.windowStartedAt };
    return true;
  }
  async consumeAndUpdatePassword({ userId, tokenHash, passwordHash, now }) {
    if (!this.record || this.record.userId !== userId || this.record.tokenHash !== tokenHash || this.record.consumedAt || this.record.expiresAt <= now) return false;
    this.record.consumedAt = now;
    this.users.find((user) => user.id === userId).passwordHash = passwordHash;
    return true;
  }
}

function setup({ failDelivery = false } = {}) {
  const users = [{ id: "user-1", email: "creator@example.com", passwordHash: "old-hash", emailVerifiedAt: null }];
  const resets = new MemoryResetRepository(users);
  let now = new Date("2026-10-10T12:00:00.000Z");
  const sent = [];
  const service = new PasswordResetService({
    users: { findByEmail: async (email) => users.find((user) => user.email === email) || null },
    resets,
    clock: () => new Date(now),
    mailer: async (message) => { if (failDelivery) throw Object.assign(new Error("safe test failure"), { providerCode: "PROVIDER_UNAVAILABLE" }); sent.push(message); },
  });
  return { service, users, resets, sent, advance(ms) { now = new Date(now.getTime() + ms); } };
}

function tokenFrom(message) {
  const link = new URL(message.text.match(/https:\/\/[^\s]+/)[0]);
  assert.equal(link.pathname, "/reset-password");
  assert.equal(link.hash, "");
  return link.searchParams.get("token");
}

test.after(() => { if (originalAppUrl === undefined) delete process.env.APP_URL; else process.env.APP_URL = originalAppUrl; });

test("successful reset stores only a hash, hashes the new password, and consumes the token", async () => {
  const { service, users, resets, sent } = setup();
  assert.deepEqual(await service.requestReset(" CREATOR@EXAMPLE.COM "), { requested: true });
  const token = tokenFrom(sent[0]);
  assert.equal(token.length, 43);
  assert.equal(resets.record.tokenHash, createHash("sha256").update(token).digest("hex"));
  assert.equal(resets.record.expiresAt.getTime() - resets.record.requestedAt.getTime(), constants.RESET_TTL_MS);
  assert.deepEqual(await service.resetPassword({ token, newPassword: "a-stronger-new-password" }), { reset: true });
  assert.notEqual(users[0].passwordHash, "old-hash");
  assert.equal(await bcrypt.compare("a-stronger-new-password", users[0].passwordHash), true);
  assert.ok(resets.record.consumedAt);
  await assert.rejects(service.resetPassword({ token, newPassword: "another-password" }), (error) => error.code === "PASSWORD_RESET_TOKEN_INVALID");
});

test("generated reset email button contains the configured frontend URL and encoded query token", async () => {
  const { service, sent } = setup();
  await service.requestReset("creator@example.com");
  const textUrl = new URL(sent[0].text.match(/https:\/\/[^\s]+/)[0]);
  const buttonHref = sent[0].html.match(/<a href="([^"]+)"[^>]*>Choose a new password<\/a>/)?.[1];
  assert.ok(buttonHref, "reset button href exists");
  const htmlUrl = new URL(buttonHref.replace(/&amp;/g, "&"));
  assert.equal(htmlUrl.origin, "https://studio.example.com");
  assert.equal(htmlUrl.pathname, "/reset-password");
  assert.equal(htmlUrl.searchParams.get("token"), textUrl.searchParams.get("token"));
  assert.equal(htmlUrl.searchParams.get("token").length, 43);
  assert.equal(htmlUrl.hash, "");
});

test("invalid and expired reset tokens are rejected", async () => {
  const { service, sent, advance } = setup();
  await service.requestReset("creator@example.com");
  await assert.rejects(service.resetPassword({ token: "not-a-reset-token", newPassword: "new-password" }), (error) => error.code === "PASSWORD_RESET_TOKEN_INVALID");
  const token = tokenFrom(sent[0]);
  advance(constants.RESET_TTL_MS + 1);
  await assert.rejects(service.resetPassword({ token, newPassword: "new-password" }), (error) => error.code === "PASSWORD_RESET_TOKEN_INVALID");
});

test("reset request cooldown and hourly request limit are enforced", async () => {
  const { service, sent, advance } = setup();
  for (let request = 0; request < constants.MAX_REQUESTS_PER_WINDOW + 1; request += 1) {
    if (request) advance(constants.RESET_COOLDOWN_MS + 1);
    assert.deepEqual(await service.requestReset("creator@example.com"), { requested: true });
  }
  assert.equal(sent.length, constants.MAX_REQUESTS_PER_WINDOW);
});

test("unknown email and known email requests have the same public service result", async () => {
  const { service, sent } = setup();
  const unknown = await service.requestReset("unknown@example.com");
  const known = await service.requestReset("creator@example.com");
  assert.deepEqual(unknown, known);
  assert.equal(sent.length, 1);
});

test("Sendlib delivery failure stays account-neutral and never claims delivery", async () => {
  const { service, resets } = setup({ failDelivery: true });
  const result = await service.requestReset("creator@example.com");
  assert.deepEqual(result, { requested: true });
  assert.ok(resets.record.tokenHash);
});

test("missing frontend URL stops before claiming a token or calling Sendlib", async () => {
  const keys = ["APP_URL", "FRONTEND_URL", "CLIENT_URL"];
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    const { service, resets, sent } = setup();
    assert.deepEqual(await service.requestReset("creator@example.com", { requestId: "missing-url-test" }), { requested: true });
    assert.equal(resets.record, null);
    assert.equal(sent.length, 0);
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});
