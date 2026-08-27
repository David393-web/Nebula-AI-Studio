const allowedGalleryTypes = [
  "IMAGE",
  "ASSET",
  "CHARACTER",
];

const validateGalleryType = (req, res, next) => {
  const { type } = req.params;

  if (!type || !type.trim()) {
    return res.status(400).json({
      success: false,
      message: "Gallery type is required",
      errors: {
        type: "Gallery type is required",
      },
    });
  }

  const normalizedType = type.trim().toUpperCase();

  if (!allowedGalleryTypes.includes(normalizedType)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: {
        type: "Invalid gallery type. Use IMAGE, ASSET, or CHARACTER",
      },
    });
  }

  // Store the normalized value so the service receives
  // IMAGE, ASSET, or CHARACTER consistently.
  req.params.type = normalizedType;

  next();
};

module.exports = {
  validateGalleryType,
};