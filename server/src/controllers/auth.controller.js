const authService = require("../services/Auth/auth.service");
const passwordResetService = require("../services/Auth/passwordReset.service");
const { getAuthCookieOptions, getAuthCookieClearOptions } = require("./authCookie");
const { randomUUID } = require("node:crypto");

const {
  validateRegister,
  validateLogin,
} = require("../validators/auth.validator");

class AuthController {
  async requestPasswordReset(req, res, next) {
    const requestId = randomUUID();
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.warn("Password reset request stopped", { requestId, requestStage: "controller_validation", reason: "INVALID_EMAIL_FORMAT" });
        return res.status(400).json({ success: false, message: "Enter a valid email address." });
      }
      console.info("Password reset request received", { requestId, requestStage: "controller_validation_passed" });
      await passwordResetService.requestReset(email, { requestId });
      return res.status(202).json({
        success: true,
        message: "If an account exists for that address, password reset instructions may be sent. Check your inbox and spam folder.",
      });
    } catch (error) {
      console.error("Password reset request failed before provider result", { requestId, requestStage: "request_pipeline", code: /^[A-Za-z0-9_.-]{1,80}$/.test(error?.code || "") ? error.code : "PASSWORD_RESET_REQUEST_FAILURE" });
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    const requestId = randomUUID();
    try {
      const token = req.body?.token;
      const newPassword = req.body?.newPassword;
      if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
        console.warn("Password reset request stopped", { requestId, requestStage: "controller_token_validation", tokenFormatValid: false });
        return res.status(400).json({ success: false, message: "That password reset link is invalid or expired. Request a new one and try again." });
      }
      console.info("Password reset request received", { requestId, requestStage: "controller_token_validation", tokenFormatValid: true });
      if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 72 || Buffer.byteLength(newPassword, "utf8") > 72) {
        console.warn("Password reset request stopped", { requestId, requestStage: "controller_password_validation", reason: "PASSWORD_FORMAT_INVALID" });
        return res.status(400).json({ success: false, message: "Password must contain 6 to 72 characters and no more than 72 UTF-8 bytes." });
      }
      await passwordResetService.resetPassword({ token, newPassword, requestId });
      console.info("Password reset request completed", { requestId, requestStage: "controller_response", outcome: "password_updated" });
      return res.status(200).json({ success: true, message: "Password updated. Sign in with your new password." });
    } catch (error) {
      if (error.code === "PASSWORD_RESET_TOKEN_INVALID") {
        console.warn("Password reset request rejected", { requestId, requestStage: "controller_response", reason: "TOKEN_INVALID_OR_EXPIRED" });
        return res.status(400).json({ success: false, message: error.message });
      }
      console.error("Password reset request failed", { requestId, requestStage: "controller_error", errorCategory: /^[A-Z0-9_.-]{1,80}$/.test(error?.code || "") ? error.code : "RESET_REQUEST_FAILURE" });
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { isValid, errors } = validateRegister(req.body);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const { email, password, name } = req.body;

      await authService.register({
        email,
        password,
        name,
      });

      return res.status(202).json({
        success: true,
        message: "Request processed. We cannot confirm inbox delivery here; if you need a code, check your inbox and spam folder or request another one.",
        data: {
          email: String(email).trim().toLowerCase(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return res.status(400).json({ success: false, message: "Enter a valid email address." });
      }
      await authService.resendVerification(email);
      return res.status(200).json({
        success: true,
        message: "If this address belongs to an unverified account, a code may be sent. Check your inbox shortly; you can retry after the cooldown if it does not arrive.",
      });
    } catch (error) { next(error); }
  }

  async verifyEmail(req, res, next) {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ success: false, message: "Enter a valid email address and six-digit code." });
      }
      await authService.verifyEmail(email, code);
      return res.status(200).json({ success: true, message: "Email verified. You can now sign in." });
    } catch (error) {
      if (error.code === "EMAIL_VERIFICATION_INVALID") return res.status(400).json({ success: false, message: "That code is invalid or expired. Request a new code and try again." });
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { isValid, errors } = validateLogin(req.body);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const { email, password } = req.body;

      const result = await authService.login({
        email,
        password,
      });

      res.cookie("nebula_token", result.token, getAuthCookieOptions());

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.clearCookie("nebula_token", getAuthCookieClearOptions());

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.userId, req.body);
      return res.status(200).json({ success: true, data: { user } });
    } catch (error) { next(error); }
  }

  async completeOnboarding(req, res, next) {
    try {
      const user = await authService.completeOnboarding(req.user.userId);
      return res.status(200).json({ success: true, data: { user } });
    } catch (error) { next(error); }
  }

  async changePassword(req, res, next) {
    try {
      await authService.changePassword(req.user.userId, req.body);
      return res.status(200).json({ success: true, message: "Password updated." });
    } catch (error) { next(error); }
  }
}

module.exports = new AuthController();
