const test = require("node:test");
const assert = require("node:assert/strict");
const authRateLimit = require("./authRateLimit");

test("auth rate limiter rejects attempts beyond the endpoint limit", () => {
  const middleware = authRateLimit({ windowMs: 60_000, max: 1 });
  const request = { ip: `reset-test-${process.pid}`, path: "/forgot-password", socket: { remoteAddress: "127.0.0.1" } };
  const response = () => ({ headers: {}, set(name, value) { this.headers[name] = value; return this; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
  let passed = 0;
  middleware(request, response(), () => { passed += 1; });
  const blocked = response();
  middleware(request, blocked, () => { passed += 1; });
  assert.equal(passed, 1);
  assert.equal(blocked.statusCode, 429);
  assert.equal(Number(blocked.headers["Retry-After"]) > 0, true);
});
