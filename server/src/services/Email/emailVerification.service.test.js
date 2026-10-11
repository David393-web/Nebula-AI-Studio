const test = require("node:test");
const assert = require("node:assert/strict");
const { EmailVerificationService, constants } = require("./emailVerification.service");

const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = "email-verification-test-secret-with-strong-entropy";

class MemoryVerificationRepository {
  constructor(users) { this.users = users; this.record = null; }
  async findByUserId(userId) { return this.record?.userId === userId ? { ...this.record } : null; }
  async createInitial(userId, values) {
    if (this.record) return false;
    this.record = { id: "verification-1", userId, ...values };
    return true;
  }
  async claimResend(record, values, { cooldownBefore, windowBefore, maxResends }) {
    if (record.lastSentAt > cooldownBefore) return false;
    const expiredWindow = record.windowStartedAt <= windowBefore;
    if (!expiredWindow && record.resendCount >= maxResends) return false;
    this.record = { ...record, ...values, resendCount: expiredWindow ? 1 : record.resendCount + 1, windowStartedAt: expiredWindow ? values.lastSentAt : record.windowStartedAt };
    return true;
  }
  async incrementAttempt(userId, now, maxAttempts) {
    if (this.record?.userId === userId && !this.record.consumedAt && this.record.expiresAt > now && this.record.attempts < maxAttempts) this.record.attempts += 1;
  }
  async consumeAndVerify(userId, expectedHash, now, verifiedAt) {
    if (!this.record || this.record.userId !== userId || this.record.codeHash !== expectedHash || this.record.consumedAt || this.record.expiresAt <= now || this.record.attempts >= 5) return false;
    this.record.consumedAt = now;
    const user = this.users.find((entry) => entry.id === userId);
    user.emailVerifiedAt = verifiedAt;
    return true;
  }
}

function setup({ failDelivery = false } = {}) {
  const users = [{ id: "user-1", email: "creator@example.com", emailVerifiedAt: null }];
  const verifications = new MemoryVerificationRepository(users);
  let now = new Date("2026-10-10T12:00:00Z");
  const sent = [];
  const service = new EmailVerificationService({
    users: { findByEmail: async (email) => users.find((user) => user.email === email) || null },
    verifications,
    clock: () => new Date(now),
    mailer: async (message) => { if (failDelivery) throw new Error("provider failure"); sent.push(message); },
  });
  return { service, users, verifications, sent, advance(ms) { now = new Date(now.getTime() + ms); } };
}

function codeFrom(message) { return message.text.match(/code is (\d{6})/)[1]; }

test.after(() => { if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret; });

test("sends a secure, expiring one-time code without storing the plaintext", async () => {
  const { service, users, verifications, sent } = setup();
  const result = await service.issue(users[0]);
  assert.deepEqual(result, { sent: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, users[0].email);
  assert.equal(verifications.record.codeHash.length, 64);
  assert.equal(verifications.record.codeHash.includes(codeFrom(sent[0])), false);
  assert.equal(verifications.record.expiresAt.getTime() - verifications.record.lastSentAt.getTime(), constants.OTP_TTL_MS);
});

test("rejects invalid codes and locks the code after the attempt limit", async () => {
  const { service, users, verifications, sent } = setup();
  await service.issue(users[0]);
  for (let attempt = 0; attempt < constants.MAX_ATTEMPTS; attempt += 1) {
    await assert.rejects(service.verify(users[0].email, "111111"), /Invalid or expired/);
  }
  assert.equal(verifications.record.attempts, constants.MAX_ATTEMPTS);
  await assert.rejects(service.verify(users[0].email, codeFrom(sent[0])), /Invalid or expired/);
});

test("rejects expired codes", async () => {
  const { service, users, sent, advance } = setup();
  await service.issue(users[0]);
  advance(constants.OTP_TTL_MS + 1);
  await assert.rejects(service.verify(users[0].email, codeFrom(sent[0])), /Invalid or expired/);
});

test("successful verification is single-use", async () => {
  const { service, users, sent } = setup();
  await service.issue(users[0]);
  const result = await service.verify(users[0].email, codeFrom(sent[0]));
  assert.ok(result.emailVerifiedAt instanceof Date);
  assert.ok(users[0].emailVerifiedAt instanceof Date);
  await assert.rejects(service.verify(users[0].email, codeFrom(sent[0])), /Invalid or expired/);
});

test("resend cooldown and hourly limit are enforced", async () => {
  const { service, users, sent, advance } = setup();
  await service.issue(users[0]);
  assert.deepEqual(await service.resend(users[0].email), { sent: false, reason: "throttled" });
  for (let resend = 1; resend < constants.MAX_RESENDS_PER_WINDOW; resend += 1) {
    advance(constants.RESEND_COOLDOWN_MS + 1);
    assert.equal((await service.resend(users[0].email)).sent, true);
  }
  advance(constants.RESEND_COOLDOWN_MS + 1);
  assert.deepEqual(await service.resend(users[0].email), { sent: false, reason: "throttled" });
  assert.equal(sent.length, constants.MAX_RESENDS_PER_WINDOW);
});

test("provider failures are reported as failures and never claim delivery", async () => {
  const { service, users, sent, verifications } = setup({ failDelivery: true });
  const result = await service.issue(users[0]);
  assert.deepEqual(result, { sent: false, reason: "provider" });
  assert.equal(sent.length, 0);
  assert.ok(verifications.record.codeHash);
});

test("resend reports provider failure without claiming that a code was sent", async () => {
  const { service, users, sent, advance } = setup({ failDelivery: true });
  await service.issue(users[0]);
  advance(constants.RESEND_COOLDOWN_MS + 1);
  assert.deepEqual(await service.resend(users[0].email), { sent: false, reason: "provider" });
  assert.equal(sent.length, 0);
});

test("resend does not reveal unknown or already verified accounts", async () => {
  const { service, users, sent } = setup();
  assert.deepEqual(await service.resend("unknown@example.com"), { sent: false });
  users[0].emailVerifiedAt = new Date();
  assert.deepEqual(await service.resend(users[0].email), { sent: false });
  assert.equal(sent.length, 0);
});
