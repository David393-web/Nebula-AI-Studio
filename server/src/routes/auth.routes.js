const express = require("express");

const authController = require("../controllers/auth.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.get("/me", authenticate, authController.me);
router.patch("/profile", authenticate, authController.updateProfile);
router.patch("/onboarding", authenticate, authController.completeOnboarding);
router.patch("/password", authenticate, authController.changePassword);

module.exports = router;
