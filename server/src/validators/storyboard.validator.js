const validateStoryboardCreate = (req, res, next) => {
  const errors = {};

  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.name = "Storyboard name is required";
  } else if (name.trim().length < 2) {
    errors.name = "Storyboard name must be at least 2 characters";
  } else if (name.trim().length > 200) {
    errors.name = "Storyboard name must not exceed 200 characters";
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

const validateStoryboardUpdate = (req, res, next) => {
  const errors = {};

  if (
    req.body.name !== undefined &&
    (
      typeof req.body.name !== "string" ||
      !req.body.name.trim()
    )
  ) {
    errors.name = "Storyboard name must be a non-empty string";
  }

  if (
    req.body.name !== undefined &&
    typeof req.body.name === "string" &&
    req.body.name.trim().length > 200
  ) {
    errors.name = "Storyboard name must not exceed 200 characters";
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
  validateStoryboardCreate,
  validateStoryboardUpdate,
};