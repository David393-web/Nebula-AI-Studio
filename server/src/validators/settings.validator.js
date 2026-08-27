const VALID_THEMES = ["dark", "light", "system"];

const validateSettingsUpdate = (data) => {
  const errors = {};

  if (data.theme !== undefined && !VALID_THEMES.includes(data.theme)) {
    errors.theme = "Theme must be dark, light, or system";
  }

  if (
    data.emailNotifications !== undefined &&
    typeof data.emailNotifications !== "boolean"
  ) {
    errors.emailNotifications =
      "emailNotifications must be a boolean";
  }

  if (
    data.pushNotifications !== undefined &&
    typeof data.pushNotifications !== "boolean"
  ) {
    errors.pushNotifications =
      "pushNotifications must be a boolean";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateSettingsUpdate,
};