const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { authenticate } = require("./auth.middleware");

test("protected requests authenticate with the nebula_token cookie", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "auth-cookie-test-secret-only";
  const token = jwt.sign({ id: "test-user" }, process.env.JWT_SECRET, { expiresIn: "1m" });
  const req = { headers: {}, cookies: { nebula_token: token } };
  let nextCalled = false;

  try {
    authenticate(req, { status() { throw new Error("Unexpected auth rejection"); }, json() {} }, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(req.user.userId, "test-user");
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test("protected requests without a cookie remain unauthorized", () => {
  let statusCode;
  let responseBody;
  authenticate(
    { headers: {}, cookies: {} },
    {
      status(code) { statusCode = code; return this; },
      json(body) { responseBody = body; return this; },
    },
    () => { throw new Error("Unexpected auth success"); },
  );

  assert.equal(statusCode, 401);
  assert.equal(responseBody.message, "Authentication required");
});
