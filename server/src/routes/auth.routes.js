const express = require("express");

const authController = require("../controllers/auth.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const authRateLimit = require("../middlewares/authRateLimit");

const router = express.Router();

router.post("/register", authRateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), authController.register);

router.post("/login", authRateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), authController.login);
router.post("/resend-verification", authRateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), authController.resendVerification);
router.post("/verify-email", authRateLimit({ windowMs: 60 * 60 * 1000, max: 30 }), authController.verifyEmail);
router.post("/forgot-password", authRateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), authController.requestPasswordReset);
router.post("/reset-password", authRateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), authController.resetPassword);

router.post("/logout", authController.logout);

router.get("/me", authenticate, authController.me);
router.patch("/profile", authenticate, authController.updateProfile);
router.patch("/onboarding", authenticate, authController.completeOnboarding);
router.patch("/password", authenticate, authController.changePassword);

module.exports = router;
