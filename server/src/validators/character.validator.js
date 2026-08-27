const validateCharacterCreate = (data) => {
  const errors = {};

  if (!data.name) {
    errors.name = "Character name is required";
  } else if (typeof data.name !== "string") {
    errors.name = "Character name must be a string";
  } else if (data.name.trim().length === 0) {
    errors.name = "Character name cannot be empty";
  } else if (data.name.trim().length > 100) {
    errors.name = "Character name must not exceed 100 characters";
  }

  if (
    data.description !== undefined &&
    data.description !== null &&
    typeof data.description !== "string"
  ) {
    errors.description = "Description must be a string";
  }

  if (
    data.imageUrl !== undefined &&
    data.imageUrl !== null &&
    typeof data.imageUrl !== "string"
  ) {
    errors.imageUrl = "Image URL must be a string";
  }

  if (
    data.metadata !== undefined &&
    data.metadata !== null &&
    (typeof data.metadata !== "object" || Array.isArray(data.metadata))
  ) {
    errors.metadata = "Metadata must be a valid object";
  }

  if (
    data.projectId !== undefined &&
    data.projectId !== null &&
    typeof data.projectId !== "string"
  ) {
    errors.projectId = "Project ID must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateCharacterUpdate = (data) => {
  const errors = {};

  if (Object.keys(data).length === 0) {
    errors.character = "At least one field is required for update";
  }

  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      errors.name = "Character name must be a string";
    } else if (data.name.trim().length === 0) {
      errors.name = "Character name cannot be empty";
    } else if (data.name.trim().length > 100) {
      errors.name = "Character name must not exceed 100 characters";
    }
  }

  if (
    data.description !== undefined &&
    data.description !== null &&
    typeof data.description !== "string"
  ) {
    errors.description = "Description must be a string";
  }

  if (
    data.imageUrl !== undefined &&
    data.imageUrl !== null &&
    typeof data.imageUrl !== "string"
  ) {
    errors.imageUrl = "Image URL must be a string";
  }

  if (
    data.metadata !== undefined &&
    data.metadata !== null &&
    (typeof data.metadata !== "object" || Array.isArray(data.metadata))
  ) {
    errors.metadata = "Metadata must be a valid object";
  }

  if (
    data.projectId !== undefined &&
    data.projectId !== null &&
    typeof data.projectId !== "string"
  ) {
    errors.projectId = "Project ID must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateCharacterCreate,
  validateCharacterUpdate,
};