const express = require("express");

const settingsController = require("../controllers/SettingsController");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", settingsController.getSettings);

router.patch("/", settingsController.updateSettings);

router.post("/reset", settingsController.resetSettings);

module.exports = router;