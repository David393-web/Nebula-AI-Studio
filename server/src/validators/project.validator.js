const VALID_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"];

const validateProjectCreate = (data = {}) => {
  const errors = {};

  // Name
  if (!data.name) {
    errors.name = "Project name is required";
  } else if (typeof data.name !== "string") {
    errors.name = "Project name must be a string";
  } else if (data.name.trim().length === 0) {
    errors.name = "Project name cannot be empty";
  } else if (data.name.trim().length > 100) {
    errors.name = "Project name must not exceed 100 characters";
  }

  // Description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== "string") {
      errors.description = "Description must be a string";
    } else if (data.description.length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
    }
  }

  // Status
  if (data.status !== undefined && data.status !== null) {
    if (!VALID_STATUSES.includes(data.status)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(", ")}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateProjectUpdate = (data = {}) => {
  const errors = {};

  // Make sure something is actually being updated
  const allowedFields = ["name", "description", "status"];

  const providedFields = Object.keys(data).filter((key) =>
    allowedFields.includes(key)
  );

  if (providedFields.length === 0) {
    errors.project = "At least one valid project field is required";
  }

  // Name
  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      errors.name = "Project name must be a string";
    } else if (data.name.trim().length === 0) {
      errors.name = "Project name cannot be empty";
    } else if (data.name.trim().length > 100) {
      errors.name = "Project name must not exceed 100 characters";
    }
  }

  // Description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== "string") {
      errors.description = "Description must be a string";
    } else if (data.description.length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
    }
  }

  // Status
  if (data.status !== undefined) {
    if (!VALID_STATUSES.includes(data.status)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(", ")}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateProjectCreate,
  validateProjectUpdate,
};