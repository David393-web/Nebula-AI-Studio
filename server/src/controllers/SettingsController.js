const settingsService = require("../services/Settings/SettingsService");

const {
  validateSettingsUpdate,
} = require("../validators/settings.validator");

const getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const settings = await settingsService.getSettings(userId);

    return res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get settings",
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { isValid, errors } = validateSettingsUpdate(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const settings = await settingsService.updateSettings(
      userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

const resetSettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const settings = await settingsService.resetSettings(userId);

    return res.status(200).json({
      success: true,
      message: "Settings reset successfully",
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error("Reset settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset settings",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
};