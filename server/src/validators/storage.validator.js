const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: {
        file: "A file is required",
      },
    });
  }

  next();
};

const validateFileDelete = (req, res, next) => {
  const { fileName } = req.params;

  if (!fileName || !fileName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: {
        fileName: "File name is required",
      },
    });
  }

  next();
};

module.exports = {
  validateFileUpload,
  validateFileDelete,
};