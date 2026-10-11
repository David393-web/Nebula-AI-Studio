const { createHash, randomBytes } = require("node:crypto");
const bcrypt = require("bcrypt");
const userRepository = require("../../repositories/UserRepository");
const resetRepository = require("../../repositories/PasswordResetRepository");
const { sendEmail } = require("../Email/sendlib.service");

const RESET_TTL_MS = 30 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;
const RESET_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function resetBaseUrl() {
  const configured = process.env.APP_URL || process.env.FRONTEND_URL || process.env.CLIENT_URL;
  let base;
  try { base = new URL(String(configured || "")); } catch { base = null; }
  if (!base || !["http:", "https:"].includes(base.protocol) || base.username || base.password || (process.env.NODE_ENV === "production" && base.protocol !== "https:")) {
    const error = new Error("A valid secure APP_URL, FRONTEND_URL, or CLIENT_URL is required to send password-reset links.");
    error.status = 503;
    error.code = "PASSWORD_RESET_URL_NOT_CONFIGURED";
    throw error;
  }
  return base;
}

function resetUrl(token) {
  const base = resetBaseUrl();
  base.pathname = `${base.pathname.replace(/\/$/, "")}/reset-password`;
  base.search = "";
  // Query parameters survive email link rewriting more reliably than fragments.
  // The client removes this value from the address bar as soon as it is read.
  base.searchParams.set("token", token);
  base.hash = "";
  return base.toString();
}

function buildResetEmail(token) {
  const link = resetUrl(token);
  const escapedLink = escapeHtml(link);
  return {
    subject: "Reset your Nebula AI Studio password",
    text: `We received a request to reset your Nebula AI Studio password. Open this one-time link within 30 minutes: ${link}\n\nIf you did not request this, you can ignore this email.`,
    html: `<!doctype html><html><body style="margin:0;background:#08080a;color:#fafafa;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#08080a"><tr><td align="center"><table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;border:1px solid #302744;border-radius:20px;background:#14121a"><tr><td style="padding:36px"><p style="margin:0 0 12px;color:#bba2ff;font-size:12px;letter-spacing:2px;text-transform:uppercase">Nebula AI Studio</p><h1 style="margin:0 0 12px;font-size:26px">Reset your password</h1><p style="color:#c4c0cc;font-size:15px;line-height:1.7">We received a request to reset your password. Use this one-time link within 30 minutes:</p><p style="margin:26px 0"><a href="${escapedLink}" style="display:inline-block;border-radius:10px;background:#793cf0;color:#fff;padding:14px 22px;text-decoration:none;font-weight:bold">Choose a new password</a></p><p style="color:#9a95a3;font-size:13px;line-height:1.6">If you did not request a password reset, you can ignore this email. Your password will not change unless you use the link.</p></td></tr></table></td></tr></table></body></html>`,
  };
}

class PasswordResetService {
  constructor({ users = userRepository, resets = resetRepository, mailer = sendEmail, clock = () => new Date() } = {}) {
    this.users = users;
    this.resets = resets;
    this.mailer = mailer;
    this.clock = clock;
  }

  async requestReset(email, { requestId = null } = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);
    if (!user) {
      console.info("Password reset request stopped", { requestId, requestStage: "account_lookup", reason: "ACCOUNT_NOT_FOUND", sendAttempted: false });
      return { requested: true };
    }

    try {
      resetBaseUrl();
    } catch (error) {
      console.error("Password reset request stopped", { requestId, requestStage: "reset_link_configuration", reason: error?.code === "PASSWORD_RESET_URL_NOT_CONFIGURED" ? error.code : "INVALID_RESET_LINK_CONFIGURATION", sendAttempted: false });
      return { requested: true };
    }

    const now = this.clock();
    const token = randomBytes(32).toString("base64url");
    const claimed = await this.resets.claimRequest(user.id, {
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + RESET_TTL_MS),
      requestedAt: now,
      consumedAt: null,
    }, {
      cooldownBefore: new Date(now.getTime() - RESET_COOLDOWN_MS),
      windowBefore: new Date(now.getTime() - RESET_WINDOW_MS),
      maxRequests: MAX_REQUESTS_PER_WINDOW,
    });
    if (!claimed) {
      console.info("Password reset request stopped", { requestId, requestStage: "reset_request_claim", reason: "COOLDOWN_OR_ACCOUNT_RATE_LIMIT", sendAttempted: false });
      return { requested: true };
    }

    let emailMessage;
    try {
      emailMessage = buildResetEmail(token);
    } catch (error) {
      console.error("Password reset request stopped", { requestId, requestStage: "email_composition", reason: error?.code === "PASSWORD_RESET_URL_NOT_CONFIGURED" ? error.code : "EMAIL_COMPOSITION_FAILURE", sendAttempted: false });
      return { requested: true };
    }

    console.info("Password reset Sendlib handoff", { requestId, requestStage: "sendlib_call", sendAttempted: true });
    try {
      const delivery = await this.mailer({ to: user.email, ...emailMessage, requestId });
      console.info("Password reset email provider result", { requestId, requestStage: "sendlib_result", accepted: delivery?.accepted === true, status: Number.isInteger(delivery?.providerStatus) ? delivery.providerStatus : null, providerMessageId: /^[a-zA-Z0-9._:-]{8,120}$/.test(delivery?.providerMessageId || "") ? delivery.providerMessageId : null });
    } catch (error) {
      console.error("Password reset email provider call failed", {
        requestId,
        requestStage: "sendlib_failure",
        providerErrorCategory: /^[A-Z0-9_.-]{1,80}$/.test(error?.providerCode || "") ? error.providerCode : "EMAIL_PROVIDER_FAILURE",
        status: Number.isInteger(error?.providerStatus) ? error.providerStatus : null,
        providerErrorCode: error?.providerDetailCode || error?.providerResponse?.category || null,
        providerMessageId: error?.providerResponse?.messageId || null,
      });
    }
    return { requested: true };
  }

  async resetPassword({ token, newPassword, requestId = null }) {
    if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH || Buffer.byteLength(newPassword, "utf8") > MAX_PASSWORD_LENGTH) {
      const error = new Error(`Password must contain ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters and no more than ${MAX_PASSWORD_LENGTH} UTF-8 bytes.`);
      error.status = 400;
      error.code = "PASSWORD_RESET_PASSWORD_INVALID";
      throw error;
    }
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      console.warn("Password reset token check", { requestId, requestStage: "token_format_check", tokenFormatValid: false });
      throw this.invalidTokenError();
    }
    console.info("Password reset token check", { requestId, requestStage: "token_hash_lookup", tokenFormatValid: true, hashAlgorithm: "SHA-256" });
    const tokenHash = hashToken(token);
    const record = await this.resets.findByTokenHash(tokenHash);
    const now = this.clock();
    if (!record) {
      console.warn("Password reset token check", { requestId, requestStage: "token_hash_lookup", hashMatched: false });
      throw this.invalidTokenError();
    }
    if (record.consumedAt || record.expiresAt <= now) {
      console.warn("Password reset token check", { requestId, requestStage: "token_state_check", hashMatched: true, consumed: Boolean(record.consumedAt), expired: record.expiresAt <= now });
      throw this.invalidTokenError();
    }
    console.info("Password reset token check", { requestId, requestStage: "token_state_check", hashMatched: true, consumed: false, expired: false });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const changed = await this.resets.consumeAndUpdatePassword({ userId: record.userId, tokenHash, passwordHash, now });
    if (!changed) {
      console.warn("Password reset token check", { requestId, requestStage: "atomic_consume", consumed: false, reason: "TOKEN_ALREADY_USED_OR_EXPIRED" });
      throw this.invalidTokenError();
    }
    console.info("Password reset token check", { requestId, requestStage: "atomic_consume", consumed: true, passwordUpdated: true });
    return { reset: true };
  }

  invalidTokenError() {
    const error = new Error("That password reset link is invalid or expired. Request a new one and try again.");
    error.status = 400;
    error.code = "PASSWORD_RESET_TOKEN_INVALID";
    return error;
  }
}

module.exports = new PasswordResetService();
module.exports.PasswordResetService = PasswordResetService;
module.exports.constants = { RESET_TTL_MS, RESET_COOLDOWN_MS, RESET_WINDOW_MS, MAX_REQUESTS_PER_WINDOW, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH };
