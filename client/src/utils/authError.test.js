import assert from "node:assert/strict";
import test from "node:test";
import { getLoginErrorMessage } from "./authError.js";

test("login failures do not reveal whether the account exists", () => {
  assert.equal(getLoginErrorMessage({ response: { status: 401 } }), "Incorrect email or password.");
});

test("network and timeout failures are distinct from incorrect credentials", () => {
  assert.match(getLoginErrorMessage({ code: "ERR_NETWORK" }), /Unable to reach the sign-in service/);
  assert.match(getLoginErrorMessage({ code: "ECONNABORTED" }), /timed out/);
});

test("server failures show safe service status instead of the credential message", () => {
  assert.equal(getLoginErrorMessage({ response: { status: 503, data: { message: "Database is temporarily unavailable. Please try again later." } } }), "Database is temporarily unavailable. Please try again later.");
  assert.match(getLoginErrorMessage({ response: { status: 500 } }), /temporarily unavailable/);
});
