const ASSET_TYPES = [
  "IMAGE",
  "VIDEO",
  "CHARACTER",
  "STORYBOARD",
  "OTHER",
];

const validateAssetCreate = (data) => {
  const errors = {};

  // NAME
  if (!data.name) {
    errors.name = "Asset name is required";
  } else if (typeof data.name !== "string") {
    errors.name = "Asset name must be a string";
  } else if (data.name.trim().length === 0) {
    errors.name = "Asset name cannot be empty";
  } else if (data.name.trim().length > 100) {
    errors.name = "Asset name must not exceed 100 characters";
  }

  // TYPE
  if (!data.type) {
    errors.type = "Asset type is required";
  } else if (typeof data.type !== "string") {
    errors.type = "Asset type must be a string";
  } else if (!ASSET_TYPES.includes(data.type)) {
    errors.type = `Asset type must be one of: ${ASSET_TYPES.join(", ")}`;
  }

  // URL
  if (!data.url) {
    errors.url = "Asset URL is required";
  } else if (typeof data.url !== "string") {
    errors.url = "Asset URL must be a string";
  } else if (data.url.trim().length === 0) {
    errors.url = "Asset URL cannot be empty";
  }

  // THUMBNAIL URL
  if (
    data.thumbnailUrl !== undefined &&
    data.thumbnailUrl !== null &&
    typeof data.thumbnailUrl !== "string"
  ) {
    errors.thumbnailUrl = "Thumbnail URL must be a string";
  }

  // METADATA
  if (
    data.metadata !== undefined &&
    data.metadata !== null &&
    (typeof data.metadata !== "object" ||
      Array.isArray(data.metadata))
  ) {
    errors.metadata = "Metadata must be a valid object";
  }

  // PROJECT ID
  if (
    data.projectId !== undefined &&
    data.projectId !== null &&
    typeof data.projectId !== "string"
  ) {
    errors.projectId = "Project ID must be a string";
  }

  // FAVORITE
  if (
    data.isFavorite !== undefined &&
    typeof data.isFavorite !== "boolean"
  ) {
    errors.isFavorite = "isFavorite must be a boolean";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateAssetUpdate = (data) => {
  const errors = {};

  // NAME
  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      errors.name = "Asset name must be a string";
    } else if (data.name.trim().length === 0) {
      errors.name = "Asset name cannot be empty";
    } else if (data.name.trim().length > 100) {
      errors.name = "Asset name must not exceed 100 characters";
    }
  }

  // TYPE
  if (data.type !== undefined) {
    if (typeof data.type !== "string") {
      errors.type = "Asset type must be a string";
    } else if (!ASSET_TYPES.includes(data.type)) {
      errors.type = `Asset type must be one of: ${ASSET_TYPES.join(", ")}`;
    }
  }

  // URL
  if (data.url !== undefined) {
    if (typeof data.url !== "string") {
      errors.url = "Asset URL must be a string";
    } else if (data.url.trim().length === 0) {
      errors.url = "Asset URL cannot be empty";
    }
  }

  // THUMBNAIL URL
  if (data.thumbnailUrl !== undefined && data.thumbnailUrl !== null) {
    if (typeof data.thumbnailUrl !== "string") {
      errors.thumbnailUrl = "Thumbnail URL must be a string";
    }
  }

  // METADATA
  if (data.metadata !== undefined && data.metadata !== null) {
    if (
      typeof data.metadata !== "object" ||
      Array.isArray(data.metadata)
    ) {
      errors.metadata = "Metadata must be a valid object";
    }
  }

  // PROJECT ID
  if (data.projectId !== undefined && data.projectId !== null) {
    if (typeof data.projectId !== "string") {
      errors.projectId = "Project ID must be a string";
    }
  }

  // FAVORITE
  if (data.isFavorite !== undefined) {
    if (typeof data.isFavorite !== "boolean") {
      errors.isFavorite = "isFavorite must be a boolean";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  ASSET_TYPES,
  validateAssetCreate,
  validateAssetUpdate,
};