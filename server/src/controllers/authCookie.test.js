const test = require("node:test");
const assert = require("node:assert/strict");
const authService = require("../services/Auth/auth.service");
const authController = require("./auth.controller");

function responseRecorder() {
  return {
    statusCode: null,
    cookieCall: null,
    clearCookieCall: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    cookie(name, value, options) { this.cookieCall = { name, options }; return this; },
    clearCookie(name, options) { this.clearCookieCall = { name, options }; return this; },
  };
}

test("production login and logout cookies support secure cross-site requests", async () => {
  const previousEnvironment = process.env.NODE_ENV;
  const originalLogin = authService.login;
  process.env.NODE_ENV = "production";
  authService.login = async () => ({ token: "test-only-cookie-value", user: { id: "user-test" } });

  try {
    const loginResponse = responseRecorder();
    await authController.login({ body: { email: "person@example.com", password: "test-password" } }, loginResponse, (error) => { throw error; });
    assert.equal(loginResponse.statusCode, 200);
    assert.equal(loginResponse.cookieCall.name, "nebula_token");
    assert.deepEqual(
      {
        httpOnly: loginResponse.cookieCall.options.httpOnly,
        secure: loginResponse.cookieCall.options.secure,
        sameSite: loginResponse.cookieCall.options.sameSite,
      },
      { httpOnly: true, secure: true, sameSite: "none" },
    );

    const logoutResponse = responseRecorder();
    await authController.logout({}, logoutResponse, (error) => { throw error; });
    assert.equal(logoutResponse.clearCookieCall.name, "nebula_token");
    assert.deepEqual(logoutResponse.clearCookieCall.options, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  } finally {
    authService.login = originalLogin;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});

test("local development keeps Lax cookies without requiring HTTPS", async () => {
  const previousEnvironment = process.env.NODE_ENV;
  const originalLogin = authService.login;
  process.env.NODE_ENV = "development";
  authService.login = async () => ({ token: "test-only-cookie-value", user: { id: "user-test" } });

  try {
    const response = responseRecorder();
    await authController.login({ body: { email: "person@example.com", password: "test-password" } }, response, (error) => { throw error; });
    assert.deepEqual(
      {
        secure: response.cookieCall.options.secure,
        sameSite: response.cookieCall.options.sameSite,
      },
      { secure: false, sameSite: "lax" },
    );
  } finally {
    authService.login = originalLogin;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});
