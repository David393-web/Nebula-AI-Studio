const { createHmac, randomBytes, randomInt, timingSafeEqual } = require("node:crypto");
const userRepository = require("../../repositories/UserRepository");
const verificationRepository = require("../../repositories/EmailVerificationRepository");
const { sendEmail } = require("./sendlib.service");

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_RESENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;

function codeDigest(userId, salt, code) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  const key = createHmac("sha256", secret).update("nebula-email-verification-v1").digest();
  return createHmac("sha256", key).update(`${userId}:${salt}:${code}`).digest("hex");
}

function buildVerificationEmail(code) {
  const html = `<!doctype html><html><body style="margin:0;background:#08080a;color:#fafafa;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#08080a"><tr><td align="center"><table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;border:1px solid #302744;border-radius:20px;background:#14121a"><tr><td style="padding:36px"><p style="margin:0 0 12px;color:#bba2ff;font-size:12px;letter-spacing:2px;text-transform:uppercase">Nebula AI Studio</p><h1 style="margin:0 0 12px;font-size:26px">Verify your email</h1><p style="color:#c4c0cc;font-size:15px;line-height:1.7">Enter this one-time code to finish setting up your account:</p><p style="margin:26px 0;padding:18px;border:1px solid #48376c;border-radius:12px;background:#201a2d;text-align:center;color:#fff;font-size:34px;font-weight:700;letter-spacing:10px">${code}</p><p style="color:#9a95a3;font-size:13px;line-height:1.6">This code expires in 10 minutes and can only be used once. If you did not create a Nebula account, you can ignore this email.</p></td></tr></table></td></tr></table></body></html>`;
  return { subject: "Your Nebula AI Studio verification code", html, text: `Your Nebula AI Studio verification code is ${code}. It expires in 10 minutes and can only be used once. If you did not create an account, you can ignore this email.` };
}

class EmailVerificationService {
  constructor({ users = userRepository, verifications = verificationRepository, mailer = sendEmail, clock = () => new Date() } = {}) {
    this.users = users;
    this.verifications = verifications;
    this.mailer = mailer;
    this.clock = clock;
  }

  async issue(user) {
    const now = this.clock();
    const code = String(randomInt(100000, 1000000));
    const salt = randomBytes(16).toString("hex");
    const values = {
      codeHash: codeDigest(user.id, salt, code),
      salt,
      attempts: 0,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      lastSentAt: now,
      consumedAt: null,
    };

    const current = await this.verifications.findByUserId(user.id);
    let claimed;
    if (!current) {
      claimed = await this.verifications.createInitial(user.id, {
        ...values,
        windowStartedAt: now,
        resendCount: 1,
      });
    } else {
      claimed = await this.verifications.claimResend(current, values, {
        cooldownBefore: new Date(now.getTime() - RESEND_COOLDOWN_MS),
        windowBefore: new Date(now.getTime() - RESEND_WINDOW_MS),
        maxResends: MAX_RESENDS_PER_WINDOW,
      });
    }
    if (!claimed) {
      console.info("Verification email not attempted", { code: "OTP_SEND_THROTTLED" });
      return { sent: false, reason: "throttled" };
    }

    try {
      await this.mailer({ to: user.email, ...buildVerificationEmail(code) });
      return { sent: true };
    } catch (error) {
      // Keep logs useful without emitting provider response bodies, recipients, codes, or credentials.
      console.error("Verification email delivery failed", {
        code: error?.providerCode || "EMAIL_PROVIDER_FAILURE",
        status: Number.isInteger(error?.providerStatus) ? error.providerStatus : null,
        providerErrorCode: error?.providerDetailCode || null,
      });
      return { sent: false, reason: "provider" };
    }
  }

  async resend(email) {
    const user = await this.users.findByEmail(String(email || "").trim().toLowerCase());
    if (!user || user.emailVerifiedAt) {
      console.info("Verification resend not attempted", { code: "NOT_ELIGIBLE_OR_ALREADY_VERIFIED" });
      return { sent: false };
    }
    return this.issue(user);
  }

  async verify(email, code) {
    const user = await this.users.findByEmail(String(email || "").trim().toLowerCase());
    const invalid = () => {
      const error = new Error("Invalid or expired verification code.");
      error.status = 400;
      error.code = "EMAIL_VERIFICATION_INVALID";
      return error;
    };
    if (!user || user.emailVerifiedAt) throw invalid();
    const record = await this.verifications.findByUserId(user.id);
    const now = this.clock();
    if (!record || record.consumedAt || record.expiresAt <= now || record.attempts >= MAX_ATTEMPTS) throw invalid();

    const actual = Buffer.from(codeDigest(user.id, record.salt, code), "hex");
    const expected = Buffer.from(record.codeHash, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      await this.verifications.incrementAttempt(user.id, now, MAX_ATTEMPTS);
      throw invalid();
    }

    const consumed = await this.verifications.consumeAndVerify(user.id, record.codeHash, now, now);
    if (!consumed) throw invalid();
    return { emailVerifiedAt: now };
  }
}

module.exports = new EmailVerificationService();
module.exports.EmailVerificationService = EmailVerificationService;
module.exports.constants = { OTP_TTL_MS, RESEND_COOLDOWN_MS, RESEND_WINDOW_MS, MAX_RESENDS_PER_WINDOW, MAX_ATTEMPTS };
