const SENDLIB_URL = "https://sendlib.samueltuoyo.com/api/send";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function providerError(code, status, providerResponse = {}) {
  const error = new Error("Email provider could not accept the message.");
  error.status = 502;
  error.providerCode = code;
  error.providerStatus = status || null;
  error.providerResponse = providerResponse;
  return error;
}

function statusCategory(status) {
  if (status === 401) return "AUTHENTICATION_REJECTED";
  if (status === 403) return "PROVIDER_FORBIDDEN";
  if (status === 404) return "ENDPOINT_NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 400 && status < 500) return "REQUEST_REJECTED";
  if (status >= 500) return "PROVIDER_ERROR";
  return "SEND_REJECTED";
}

function safeProviderCode(body) {
  const candidate = body?.code || body?.error?.code || body?.error?.type || (typeof body?.error === "string" ? body.error : null);
  if (typeof candidate !== "string") return null;
  const normalized = candidate.toUpperCase().replace(/[.-]/g, "_");
  if (["INVALID_API_KEY", "UNAUTHORIZED", "AUTHENTICATION_FAILED"].includes(normalized)) return "AUTHENTICATION_REJECTED";
  if (["RATE_LIMITED", "TOO_MANY_REQUESTS", "RATE_LIMIT_EXCEEDED"].includes(normalized)) return "RATE_LIMITED";
  if (["SENDER_NOT_ALLOWED", "UNVERIFIED_SENDER", "SENDER_NOT_AUTHORIZED"].includes(normalized)) return "SENDER_REJECTED";
  if (["INVALID_REQUEST", "BAD_REQUEST", "INVALID_ARGUMENT"].includes(normalized)) return "REQUEST_REJECTED";
  return "PROVIDER_ERROR_CODE_PRESENT";
}

function extractSafeMessageId(body, sensitiveValues = []) {
  const candidate = body?.messageId || body?.message_id || body?.id || body?.data?.messageId || body?.data?.message_id || body?.data?.id || null;
  if (typeof candidate !== "string" || !/^[a-zA-Z0-9._:-]{8,120}$/.test(candidate)) return null;
  const echoesSensitiveValue = sensitiveValues.filter((value) => typeof value === "string" && value.length >= 8)
    .some((value) => value === candidate || value.includes(candidate) || (value.length >= 24 && candidate.includes(value)));
  return echoesSensitiveValue ? null : candidate;
}

function errorResponse(error, sensitiveValues) {
  const status = Number.isInteger(error?.response?.status)
    ? error.response.status
    : Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599
      ? error.status
      : null;
  let body = error?.response?.data;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  return { status, body, providerErrorCode: safeProviderCode(body), providerMessageId: extractSafeMessageId(body, sensitiveValues) };
}

async function sendEmail({ to, subject, html, text, requestId = null }, fetchImplementation = fetch) {
  const apiKey = process.env.SENDLIB_API_KEY;
  const fromEmail = String(process.env.SENDLIB_FROM_EMAIL || "").trim();
  const fromName = process.env.SENDLIB_FROM_NAME || "Nebula AI Studio";
  if (!apiKey || !fromEmail) {
    console.error("Sendlib request stopped", { requestId, requestStage: "configuration", status: null, providerErrorCategory: "PROVIDER_NOT_CONFIGURED", providerMessageId: null, apiKeyPresent: Boolean(apiKey), senderPresent: Boolean(fromEmail) });
    const error = new Error("Sendlib is not configured.");
    error.status = 503;
    error.providerCode = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }
  const senderAddress = fromEmail.match(/<([^<>]+)>/)?.[1] || fromEmail;
  const recipient = (Array.isArray(to) ? to : [to]).map((entry) => typeof entry === "string" ? entry : entry?.email);
  if (!EMAIL_PATTERN.test(senderAddress) || !recipient.length || recipient.some((address) => typeof address !== "string" || address.length > 254 || !EMAIL_PATTERN.test(address.trim()))) {
    console.error("Sendlib request stopped", { requestId, requestStage: "request_validation", status: null, providerErrorCategory: "INVALID_EMAIL_ADDRESS", providerMessageId: null });
    const error = new Error("A valid sender and recipient email address are required.");
    error.status = 400;
    error.providerCode = "INVALID_EMAIL_ADDRESS";
    throw error;
  }
  const from = fromName ? `"${fromName.replace(/[\\"\r\n]/g, "")}" <${senderAddress}>` : senderAddress;
  const sensitiveValues = [apiKey, fromEmail, ...recipient, subject, html, text];
  let response;
  console.info("Sendlib HTTP request", { requestId, requestStage: "request_started", method: "POST", endpoint: SENDLIB_URL, authorization: "Bearer configured", senderConfigured: true, recipientCount: recipient.length, payloadFields: ["from", "to", "subject", "html", "text"] });
  try {
    response = await fetchImplementation(SENDLIB_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: recipient.length === 1 ? recipient[0].trim() : recipient.map((address) => address.trim()), subject, html, text }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (requestError) {
    const details = errorResponse(requestError, sensitiveValues);
    const category = details.status ? statusCategory(details.status) : "PROVIDER_UNAVAILABLE";
    console.error("Sendlib HTTP request", { requestId, requestStage: details.status ? "http_error_response" : "transport_error", status: details.status, providerErrorCategory: category, providerErrorCode: details.providerErrorCode, providerMessageId: details.providerMessageId });
    throw providerError(category, details.status, { category: details.providerErrorCode, messageId: details.providerMessageId });
  }
  console.info("Sendlib HTTP request", { requestId, requestStage: "http_response_received", status: response.status });
  let body;
  try {
    body = await response.json();
  } catch {
    const category = response.ok ? "MALFORMED_RESPONSE" : statusCategory(response.status);
    console.error("Sendlib HTTP request", { requestId, requestStage: "response_body_invalid", status: response.status, providerErrorCategory: category, providerErrorCode: null, providerMessageId: null });
    throw providerError(category, response.status, { category: null, messageId: null, bodyCategory: "NON_JSON" });
  }
  const safeMessageId = extractSafeMessageId(body, sensitiveValues);
  const providerErrorCode = safeProviderCode(body);
  if (!response.ok || !body || typeof body !== "object" || Array.isArray(body) || body.success === false || body.error || !safeMessageId) {
    const code = !response.ok ? statusCategory(response.status) : "MALFORMED_RESPONSE";
    const bodyCategory = providerErrorCode ? "PROVIDER_CODE" : body?.error ? "PROVIDER_ERROR" : !safeMessageId ? "MISSING_MESSAGE_ID" : "INVALID_RESPONSE";
    console.error("Sendlib HTTP request", { requestId, requestStage: "provider_rejected", status: response.status, providerErrorCategory: code, providerErrorCode, providerMessageId: safeMessageId, bodyCategory });
    const error = providerError(code, response.status, { category: providerErrorCode, messageId: safeMessageId, bodyCategory });
    error.providerDetailCode = providerErrorCode;
    throw error;
  }
  console.info("Sendlib HTTP request", { requestId, requestStage: "provider_accepted", status: response.status, providerErrorCategory: null, providerMessageId: safeMessageId });
  return { accepted: true, providerMessageId: safeMessageId, providerStatus: response.status };
}

module.exports = { sendEmail, SENDLIB_URL };
