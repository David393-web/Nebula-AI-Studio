const videoRepository = require("../../repositories/VideoRepository");
const projectRepository = require("../../repositories/ProjectRepository");

const allowedTypes = ["VIDEO"];

class VideoService {
  // CREATE VIDEO
  async createVideo({
    name,
    prompt,
    url,
    thumbnailUrl,
    duration,
    metadata,
    userId,
    projectId,
    isFavorite,
  }) {
    if (!name || !name.trim()) {
      const error = new Error("Video name is required");
      error.status = 400;
      throw error;
    }

    if (!url || !url.trim()) {
      const error = new Error("Video URL is required");
      error.status = 400;
      throw error;
    }

    if (!userId) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }

    if (duration !== undefined && duration !== null) {
      if (
        !Number.isInteger(duration) ||
        duration < 0
      ) {
        const error = new Error(
          "Video duration must be a non-negative integer"
        );
        error.status = 400;
        throw error;
      }
    }

    // Validate project ownership if supplied
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

    return videoRepository.create({
      name: name.trim(),
      prompt: prompt?.trim() || null,
      url: url.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || null,
      duration: duration ?? null,
      metadata: metadata || null,
      userId,
      projectId: projectId || null,
      isFavorite: isFavorite ?? false,
    });
  }

  // GET ALL VIDEOS
  async getVideos(userId) {
    return videoRepository.findByUser(userId);
  }

  // GET VIDEOS FOR A PROJECT
  async getProjectVideos(projectId, userId) {
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

    return videoRepository.findByProject(
      projectId,
      userId
    );
  }

  // GET SINGLE VIDEO
  async getVideo(id, userId) {
    const video = await videoRepository.findById(id);

    if (!video) {
      const error = new Error("Video not found");
      error.status = 404;
      throw error;
    }

    if (video.userId !== userId) {
      const error = new Error(
        "You do not have access to this video"
      );
      error.status = 403;
      throw error;
    }

    return video;
  }

  // UPDATE VIDEO
  async updateVideo(id, userId, data) {
    await this.getVideo(id, userId);

    const allowedData = {};

    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        const error = new Error("Video name cannot be empty");
        error.status = 400;
        throw error;
      }

      allowedData.name = data.name.trim();
    }

    if (data.prompt !== undefined) {
      allowedData.prompt =
        data.prompt?.trim() || null;
    }

    if (data.url !== undefined) {
      if (!data.url || !data.url.trim()) {
        const error = new Error("Video URL cannot be empty");
        error.status = 400;
        throw error;
      }

      allowedData.url = data.url.trim();
    }

    if (data.thumbnailUrl !== undefined) {
      allowedData.thumbnailUrl =
        data.thumbnailUrl?.trim() || null;
    }

    if (data.duration !== undefined) {
      if (
        data.duration !== null &&
        (!Number.isInteger(data.duration) ||
          data.duration < 0)
      ) {
        const error = new Error(
          "Video duration must be a non-negative integer"
        );
        error.status = 400;
        throw error;
      }

      allowedData.duration = data.duration;
    }

    if (data.metadata !== undefined) {
      allowedData.metadata = data.metadata;
    }

    if (data.isFavorite !== undefined) {
      if (typeof data.isFavorite !== "boolean") {
        const error = new Error(
          "isFavorite must be a boolean"
        );
        error.status = 400;
        throw error;
      }

      allowedData.isFavorite = data.isFavorite;
    }

    if (data.projectId !== undefined) {
      if (
        data.projectId === null ||
        data.projectId === ""
      ) {
        allowedData.projectId = null;
      } else {
        const project = await projectRepository.findById(
          data.projectId
        );

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

        allowedData.projectId = data.projectId;
      }
    }

    if (Object.keys(allowedData).length === 0) {
      const error = new Error(
        "No valid fields provided for update"
      );
      error.status = 400;
      throw error;
    }

    return videoRepository.update(id, allowedData);
  }

  // DELETE VIDEO
  async deleteVideo(id, userId) {
    await this.getVideo(id, userId);

    await videoRepository.delete(id);
  }
}

module.exports = new VideoService();