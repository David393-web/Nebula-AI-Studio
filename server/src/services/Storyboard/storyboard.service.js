const storyboardRepository = require("../../repositories/StoryboardRepository");

class StoryboardService {
  async create(userId, data) {
    if (!userId) {
      const error = new Error("User ID is required");
      error.status = 400;
      throw error;
    }

    return storyboardRepository.create({
      ...data,
      userId,
    });
  }

  async getAll(userId) {
    if (!userId) {
      const error = new Error("User ID is required");
      error.status = 400;
      throw error;
    }

    return storyboardRepository.findByUser(userId);
  }

  async getOne(userId, storyboardId) {
    if (!userId) {
      const error = new Error("User ID is required");
      error.status = 400;
      throw error;
    }

    if (!storyboardId) {
      const error = new Error("Storyboard ID is required");
      error.status = 400;
      throw error;
    }

    const storyboard = await storyboardRepository.findById(
      storyboardId,
      userId
    );

    if (!storyboard) {
      const error = new Error("Storyboard not found");
      error.status = 404;
      throw error;
    }

    return storyboard;
  }

  async update(userId, storyboardId, data) {
    if (!userId) {
      const error = new Error("User ID is required");
      error.status = 400;
      throw error;
    }

    if (!storyboardId) {
      const error = new Error("Storyboard ID is required");
      error.status = 400;
      throw error;
    }

    const existingStoryboard =
      await storyboardRepository.findById(
        storyboardId,
        userId
      );

    if (!existingStoryboard) {
      const error = new Error("Storyboard not found");
      error.status = 404;
      throw error;
    }

    return storyboardRepository.update(
      storyboardId,
      userId,
      data
    );
  }

  async delete(userId, storyboardId) {
    if (!userId) {
      const error = new Error("User ID is required");
      error.status = 400;
      throw error;
    }

    if (!storyboardId) {
      const error = new Error("Storyboard ID is required");
      error.status = 400;
      throw error;
    }

    const existingStoryboard =
      await storyboardRepository.findById(
        storyboardId,
        userId
      );

    if (!existingStoryboard) {
      const error = new Error("Storyboard not found");
      error.status = 404;
      throw error;
    }

    await storyboardRepository.delete(
      storyboardId,
      userId
    );

    return {
      success: true,
      message: "Storyboard deleted successfully",
    };
  }
}

module.exports = new StoryboardService();