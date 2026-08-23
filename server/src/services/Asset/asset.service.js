const assetRepository = require("../../repositories/AssetRepository");
const projectRepository = require("../../repositories/ProjectRepository");

const allowedTypes = [
  "IMAGE",
  "VIDEO",
  "CHARACTER",
  "STORYBOARD",
  "OTHER",
];

class AssetService {
  // CREATE ASSET
  async createAsset({
    name,
    type,
    url,
    thumbnailUrl,
    metadata,
    userId,
    projectId,
  }) {
    // Validate name
    if (!name || !name.trim()) {
      const error = new Error("Asset name is required");
      error.status = 400;
      throw error;
    }

    // Validate type
    if (!type || !allowedTypes.includes(type)) {
      const error = new Error(
        `Invalid asset type. Allowed types: ${allowedTypes.join(", ")}`
      );
      error.status = 400;
      throw error;
    }

    // Validate URL
    if (!url || !url.trim()) {
      const error = new Error("Asset URL is required");
      error.status = 400;
      throw error;
    }

    // Validate project if provided
    if (projectId) {
      const project = await projectRepository.findById(projectId);

      if (!project) {
        const error = new Error("Project not found");
        error.status = 404;
        throw error;
      }

      if (project.ownerId !== userId) {
        const error = new Error(
          "You do not have access to this project"
        );
        error.status = 403;
        throw error;
      }
    }

    // Create asset
    return assetRepository.create({
      name: name.trim(),
      type,
      url: url.trim(),
      thumbnailUrl: thumbnailUrl || null,
      metadata: metadata || null,
      userId,
      projectId: projectId || null,
    });
  }

  // GET ALL ASSETS FOR USER
  async getAssets(userId) {
    return assetRepository.findByUser(userId);
  }

  // GET SINGLE ASSET
  async getAsset(id, userId) {
    const asset = await assetRepository.findById(id);

    if (!asset) {
      const error = new Error("Asset not found");
      error.status = 404;
      throw error;
    }

    // Make sure the asset belongs to the logged-in user
    if (asset.userId !== userId) {
      const error = new Error(
        "You do not have access to this asset"
      );
      error.status = 403;
      throw error;
    }

    return asset;
  }

  // UPDATE ASSET
  async updateAsset(id, userId, data) {
    // Confirm asset exists and belongs to user
    await this.getAsset(id, userId);

    const allowedData = {};

    // Name
    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        const error = new Error("Asset name cannot be empty");
        error.status = 400;
        throw error;
      }

      allowedData.name = data.name.trim();
    }

    // Type
    if (data.type !== undefined) {
      if (!allowedTypes.includes(data.type)) {
        const error = new Error(
          `Invalid asset type. Allowed types: ${allowedTypes.join(", ")}`
        );
        error.status = 400;
        throw error;
      }

      allowedData.type = data.type;
    }

    // URL
    if (data.url !== undefined) {
      if (!data.url || !data.url.trim()) {
        const error = new Error("Asset URL cannot be empty");
        error.status = 400;
        throw error;
      }

      allowedData.url = data.url.trim();
    }

    // Thumbnail URL
    if (data.thumbnailUrl !== undefined) {
      allowedData.thumbnailUrl = data.thumbnailUrl;
    }

    // Metadata
    if (data.metadata !== undefined) {
      allowedData.metadata = data.metadata;
    }

    // Favorite status
    if (data.isFavorite !== undefined) {
      allowedData.isFavorite = data.isFavorite;
    }

    // Prevent an empty update
    if (Object.keys(allowedData).length === 0) {
      const error = new Error("No valid fields provided for update");
      error.status = 400;
      throw error;
    }

    return assetRepository.update(id, allowedData);
  }

  // DELETE ASSET
  async deleteAsset(id, userId) {
    // Confirm asset exists and belongs to user
    await this.getAsset(id, userId);

    await assetRepository.delete(id);
  }
}

module.exports = new AssetService();