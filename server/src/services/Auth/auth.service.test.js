const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { AuthService } = require("./auth.service");

const originalSecret = process.env.JWT_SECRET;
const testSecret = "auth-service-regression-test-secret";
const storedPassword = "correct-test-password";
let passwordHash;

test.before(async () => { passwordHash = await bcrypt.hash(storedPassword, 4); process.env.JWT_SECRET = testSecret; });
test.after(() => { if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret; });

function serviceWith(findByEmail) {
  return new AuthService({ repository: { findByEmail } });
}

test("successful login normalizes lookup, verifies password, and creates a verifiable JWT", async () => {
  const user = { id: "user-1", email: "creator@example.com", role: "USER", passwordHash };
  let lookedUpEmail;
  const service = serviceWith(async (email) => { lookedUpEmail = email; return user; });
  const result = await service.login({ email: "  CREATOR@EXAMPLE.COM ", password: storedPassword });
  assert.equal(lookedUpEmail, "creator@example.com");
  assert.equal(result.user.id, user.id);
  assert.equal("passwordHash" in result.user, false);
  assert.equal(jwt.verify(result.token, testSecret, { algorithms: ["HS256"] }).id, user.id);
});

test("incorrect password uses the same credential error as an unknown user", async () => {
  const service = serviceWith(async () => ({ id: "user-1", passwordHash }));
  await assert.rejects(service.login({ email: "creator@example.com", password: "incorrect-test-password" }), (error) => error.status === 401 && error.message === "Invalid email or password");
});

test("nonexistent user uses the same credential error", async () => {
  const service = serviceWith(async () => null);
  await assert.rejects(service.login({ email: "missing@example.com", password: storedPassword }), (error) => error.status === 401 && error.message === "Invalid email or password");
});

test("database and server errors propagate instead of becoming credential errors", async () => {
  const databaseError = Object.assign(new Error("Database connection failed"), { code: "P1001" });
  const service = serviceWith(async () => { throw databaseError; });
  await assert.rejects(service.login({ email: "creator@example.com", password: storedPassword }), (error) => error === databaseError && error.status !== 401);
});

test("legacy account records without verification fields remain compatible", async () => {
  const user = { id: "legacy-1", email: "legacy@example.com", role: "USER", passwordHash };
  const result = await serviceWith(async () => user).login({ email: user.email, password: storedPassword });
  assert.equal(result.user.id, user.id);
});

test("new unverified users with valid credentials are directed to verification", async () => {
  const user = { id: "pending-1", email: "pending@example.com", role: "USER", passwordHash, emailVerifiedAt: null };
  await assert.rejects(serviceWith(async () => user).login({ email: user.email, password: storedPassword }), (error) => error.status === 403 && error.code === "EMAIL_NOT_VERIFIED");
});

test("registration requests one verification email and persists an unverified account", async () => {
  let created;
  let issued;
  const user = { id: "new-1", email: "new@example.com", role: "USER", emailVerifiedAt: null };
  const service = new AuthService({
    repository: { async findByEmail() { return null; }, async createUser(value) { created = value; return user; } },
    verification: { async issue(value) { issued = value; return { sent: true }; } },
  });
  const result = await service.register({ email: " NEW@EXAMPLE.COM ", password: storedPassword, name: " New User " });
  assert.equal(created.email, "new@example.com");
  assert.equal(issued.id, user.id);
  assert.equal(result.created, true);
  assert.equal(result.verificationSent, true);
  assert.equal("passwordHash" in result.user, false);
});

test("registration retry does not duplicate a pending account and can resend for its owner", async () => {
  let creates = 0;
  let sends = 0;
  const pending = { id: "pending-2", email: "pending@example.com", passwordHash, role: "USER", emailVerifiedAt: null };
  const service = new AuthService({
    repository: { async findByEmail() { return pending; }, async createUser() { creates += 1; } },
    verification: { async issue() { sends += 1; return { sent: true }; } },
  });
  const result = await service.register({ email: pending.email, password: storedPassword });
  assert.equal(creates, 0);
  assert.equal(sends, 1);
  assert.equal(result.created, false);
  assert.equal(result.verificationSent, true);
});

test("registration remains account-neutral when the email already exists", async () => {
  let creates = 0;
  const existing = { id: "already-1", email: "already@example.com", passwordHash, emailVerifiedAt: new Date() };
  const service = new AuthService({
    repository: { async findByEmail() { return existing; }, async createUser() { creates += 1; } },
    verification: { async issue() { throw new Error("must not send"); } },
  });
  const result = await service.register({ email: existing.email, password: storedPassword });
  assert.deepEqual(result, { user: null, created: false, verificationSent: false });
  assert.equal(creates, 0);
});

test("registration persists an account but reports failed verification delivery internally", async () => {
  const user = { id: "new-failed", email: "new-failed@example.com", role: "USER", emailVerifiedAt: null };
  const service = new AuthService({
    repository: { async findByEmail() { return null; }, async createUser() { return user; } },
    verification: { async issue() { return { sent: false, reason: "provider" }; } },
  });
  const result = await service.register({ email: user.email, password: storedPassword });
  assert.equal(result.created, true);
  assert.equal(result.verificationSent, false);
  assert.equal(result.user.id, user.id);
});
