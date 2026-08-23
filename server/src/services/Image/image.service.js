const imageRepository = require("../../repositories/ImageRepository");
const projectRepository = require("../../repositories/ProjectRepository");

class ImageService {
  async createImage({
    name,
    prompt,
    url,
    thumbnailUrl,
    metadata,
    userId,
    projectId,
  }) {
    // Validate name
    if (!name || !name.trim()) {
      const error = new Error("Image name is required");
      error.status = 400;
      throw error;
    }

    // Validate URL
    if (!url || !url.trim()) {
      const error = new Error("Image URL is required");
      error.status = 400;
      throw error;
    }

    // Validate project ownership
    if (projectId) {
      const project = await projectRepository.findById(projectId);

      if (!project) {
        const error = new Error("Project not found");
        error.status = 404;
        throw error;
      }

      if (project.ownerId !== userId) {
        const error = new Error(
          "You do not have access to this project",
        );
        error.status = 403;
        throw error;
      }
    }

    return imageRepository.create({
      name: name.trim(),
      prompt:
        prompt && prompt.trim()
          ? prompt.trim()
          : null,
      url: url.trim(),
      thumbnailUrl:
        thumbnailUrl && thumbnailUrl.trim()
          ? thumbnailUrl.trim()
          : null,
      metadata: metadata ?? null,
      userId,
      projectId: projectId || null,
    });
  }

  async getImages(userId) {
    return imageRepository.findByUser(userId);
  }

  async getImage(id, userId) {
    const image = await imageRepository.findById(id);

    if (!image) {
      const error = new Error("Image not found");
      error.status = 404;
      throw error;
    }

    if (image.userId !== userId) {
      const error = new Error(
        "You do not have access to this image",
      );
      error.status = 403;
      throw error;
    }

    return image;
  }

  async updateImage(id, userId, data) {
    // Also verifies that the image exists
    // and belongs to the current user.
    await this.getImage(id, userId);

    const allowedData = {};

    // Name
    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        const error = new Error("Image name cannot be empty");
        error.status = 400;
        throw error;
      }

      allowedData.name = data.name.trim();
    }

    // Prompt
    if (data.prompt !== undefined) {
      allowedData.prompt =
        data.prompt && data.prompt.trim()
          ? data.prompt.trim()
          : null;
    }

    // URL
    if (data.url !== undefined) {
      if (!data.url || !data.url.trim()) {
        const error = new Error("Image URL cannot be empty");
        error.status = 400;
        throw error;
      }

      allowedData.url = data.url.trim();
    }

    // Thumbnail URL
    if (data.thumbnailUrl !== undefined) {
      allowedData.thumbnailUrl =
        data.thumbnailUrl && data.thumbnailUrl.trim()
          ? data.thumbnailUrl.trim()
          : null;
    }

    // Metadata
    if (data.metadata !== undefined) {
      allowedData.metadata = data.metadata;
    }

    // Favorite
    if (data.isFavorite !== undefined) {
      if (typeof data.isFavorite !== "boolean") {
        const error = new Error(
          "isFavorite must be a boolean",
        );
        error.status = 400;
        throw error;
      }

      allowedData.isFavorite = data.isFavorite;
    }

    // Prevent empty PATCH requests
    if (Object.keys(allowedData).length === 0) {
      const error = new Error(
        "No valid fields provided for update",
      );
      error.status = 400;
      throw error;
    }

    return imageRepository.update(id, allowedData);
  }

  async deleteImage(id, userId) {
    // Verifies ownership before deletion
    await this.getImage(id, userId);

    await imageRepository.delete(id);
  }
}

module.exports = new ImageService();