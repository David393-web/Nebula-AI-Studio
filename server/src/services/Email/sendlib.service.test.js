const test = require("node:test");
const assert = require("node:assert/strict");
const { sendEmail, SENDLIB_URL } = require("./sendlib.service");

const original = {
  key: process.env.SENDLIB_API_KEY,
  from: process.env.SENDLIB_FROM_EMAIL,
  name: process.env.SENDLIB_FROM_NAME,
};
test.before(() => {
  process.env.SENDLIB_API_KEY = "test-secret-never-logged";
  process.env.SENDLIB_FROM_EMAIL = "sender@example.com";
  process.env.SENDLIB_FROM_NAME = "Nebula Test";
});
test.after(() => {
  if (original.key === undefined) delete process.env.SENDLIB_API_KEY; else process.env.SENDLIB_API_KEY = original.key;
  if (original.from === undefined) delete process.env.SENDLIB_FROM_EMAIL; else process.env.SENDLIB_FROM_EMAIL = original.from;
  if (original.name === undefined) delete process.env.SENDLIB_FROM_NAME; else process.env.SENDLIB_FROM_NAME = original.name;
});

const ok = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("sends the documented Sendlib payload and returns provider acceptance", async () => {
  let request;
  const result = await sendEmail({ to: "creator@example.com", subject: "Code", html: "<p>Verify</p>", text: "Verify" }, async (url, options) => {
    request = { url, options };
    return ok({ success: true, messageId: "send-123" }, 202);
  });
  assert.equal(request.url, SENDLIB_URL);
  assert.equal(request.options.headers.Authorization, "Bearer test-secret-never-logged");
  assert.deepEqual(JSON.parse(request.options.body), {
    from: '"Nebula Test" <sender@example.com>', to: "creator@example.com", subject: "Code", html: "<p>Verify</p>", text: "Verify",
  });
  assert.deepEqual(result, { accepted: true, providerMessageId: "send-123", providerStatus: 202 });
});

test("rejects provider errors and non-acceptance response bodies", async () => {
  await assert.rejects(sendEmail({ to: "creator@example.com", subject: "Code", html: "x" }, async () => ok({ error: "rejected" }, 400)), (error) => error.providerCode === "REQUEST_REJECTED" && error.providerStatus === 400 && error.providerResponse.bodyCategory === "PROVIDER_CODE" && error.providerResponse.category === "PROVIDER_ERROR_CODE_PRESENT");
  await assert.rejects(sendEmail({ to: "creator@example.com", subject: "Code", html: "x" }, async () => ok({ success: false }, 200)), (error) => error.providerCode === "MALFORMED_RESPONSE");
  await assert.rejects(sendEmail({ to: "creator@example.com", subject: "Code", html: "x" }, async () => ok({ success: true }, 200)), (error) => error.providerCode === "MALFORMED_RESPONSE");
});

test("reports network failures and malformed JSON without disclosing secrets", async () => {
  await assert.rejects(sendEmail({ to: "creator@example.com", subject: "Code", html: "x" }, async () => { throw new Error("network details"); }), (error) => error.providerCode === "PROVIDER_UNAVAILABLE");
  await assert.rejects(sendEmail({ to: "creator@example.com", subject: "Code", html: "x" }, async () => ({ ok: true, status: 200, json: async () => { throw new Error("bad json"); } })), (error) => error.providerCode === "MALFORMED_RESPONSE");
});

test("preserves Axios-style provider status and only exposes sanitized error diagnostics", async () => {
  const originalError = console.error;
  const events = [];
  console.error = (...args) => events.push(args);
  try {
    await assert.rejects(
      sendEmail({ to: "creator@example.com", subject: "Code", html: "x", requestId: "safe-correlation-id" }, async () => {
        throw Object.assign(new Error("do-not-log-api-key creator@example.com"), {
          response: { status: 403, data: { code: "secret-provider-token-value", message: "creator@example.com was forbidden", messageId: "provider-403-id" } },
        });
      }),
      (error) => error.providerCode === "PROVIDER_FORBIDDEN"
        && error.providerStatus === 403
        && error.providerResponse.category === "PROVIDER_ERROR_CODE_PRESENT"
        && error.providerResponse.messageId === "provider-403-id",
    );
    const resetToken = "R".repeat(43);
    await assert.rejects(
      sendEmail({ to: "creator@example.com", subject: "Reset", html: `<p>${resetToken}</p>`, text: resetToken }, async () => {
        throw Object.assign(new Error("provider error"), { response: { status: 403, data: { messageId: resetToken } } });
      }),
      (error) => error.providerStatus === 403 && error.providerResponse.messageId === null,
    );
  } finally { console.error = originalError; }
  const serialized = JSON.stringify(events);
  assert.match(serialized, /403/);
  assert.match(serialized, /PROVIDER_FORBIDDEN/);
  assert.match(serialized, /provider-403-id/);
  assert.doesNotMatch(serialized, /secret-provider-token-value|creator@example\.com|do-not-log-api-key|R{43}/);
});

test("validates sender and recipient before contacting Sendlib", async () => {
  let called = false;
  await assert.rejects(sendEmail({ to: "bad-address", subject: "Code", html: "x" }, async () => { called = true; }), (error) => error.providerCode === "INVALID_EMAIL_ADDRESS");
  assert.equal(called, false);
});
