import test from "node:test";
import assert from "node:assert/strict";
import { extractResetToken, makeResetPasswordPayload, resetUrlWithoutToken } from "./resetLink.js";

test("reads a reset token from the emailed query parameter", () => {
  const location = new URL("https://studio.example.com/reset-password?token=secure_token_123");
  assert.equal(extractResetToken(location), "secure_token_123");
});

test("continues to accept valid links issued with the previous fragment format", () => {
  const location = new URL("https://studio.example.com/reset-password#token=previous_token_123");
  assert.equal(extractResetToken(location), "previous_token_123");
});

test("missing token is empty and token is removed from the browser URL", () => {
  const missing = new URL("https://studio.example.com/reset-password");
  assert.equal(extractResetToken(missing), "");

  const withQuery = new URL("https://studio.example.com/reset-password?token=secret&campaign=mail");
  assert.equal(resetUrlWithoutToken(withQuery), "/reset-password?campaign=mail");
  const withFragment = new URL("https://studio.example.com/reset-password#token=secret");
  assert.equal(resetUrlWithoutToken(withFragment), "/reset-password");
});

test("captured token remains available for the API payload after URL cleanup", () => {
  const location = new URL("https://studio.example.com/reset-password?token=api_token_123");
  const capturedToken = extractResetToken(location);
  const cleanedUrl = resetUrlWithoutToken(location);
  const payload = makeResetPasswordPayload(capturedToken, "new-password-value");
  assert.equal(cleanedUrl, "/reset-password");
  assert.deepEqual(payload, { token: "api_token_123", newPassword: "new-password-value" });
});
