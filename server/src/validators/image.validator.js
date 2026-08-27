const allowedImageFields = [
  "name",
  "prompt",
  "url",
  "thumbnailUrl",
  "metadata",
  "projectId",
  "isFavorite",
];

const validateCreateImage = (req, res, next) => {
  const { name, url } = req.body;

  const errors = {};

  if (!name || !name.trim()) {
    errors.name = "Image name is required";
  }

  if (!url || !url.trim()) {
    errors.url = "Image URL is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateUpdateImage = (req, res, next) => {
  const errors = {};

  const providedFields = Object.keys(req.body);

  // Prevent unknown fields from being updated
  const unknownFields = providedFields.filter(
    (field) => !allowedImageFields.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.fields = `Invalid fields: ${unknownFields.join(", ")}`;
  }

  // If name is provided, it cannot be empty
  if (
    req.body.name !== undefined &&
    (!req.body.name || !req.body.name.trim())
  ) {
    errors.name = "Image name cannot be empty";
  }

  // If URL is provided, it cannot be empty
  if (
    req.body.url !== undefined &&
    (!req.body.url || !req.body.url.trim())
  ) {
    errors.url = "Image URL cannot be empty";
  }

  // Don't allow an empty PATCH request
  if (providedFields.length === 0) {
    errors.fields = "At least one field is required for update";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

module.exports = {
  validateCreateImage,
  validateUpdateImage,
};