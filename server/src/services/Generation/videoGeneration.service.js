const wanVideoProvider = require("../../providers/alibaba/wanVideo.provider");

class VideoGenerationService {
  async getTaskStatus(taskId, model) {
    return wanVideoProvider.getVideoTaskStatus(taskId, model);
  }

  async generate({ userId, imageUrl, referenceImageUrls, frameMode, prompt, duration, quality, audio, requestedModel, onStarted, onProgress, generationId, awaitCompletion = true }) {
    if (!userId) {
      throw new Error("Authenticated user is required.");
    }

    if (!imageUrl) {
      throw new Error("Storyboard image is required.");
    }

    if (!prompt) {
      throw new Error("Video prompt is required.");
    }

    const result = await wanVideoProvider.generateVideo({
      imageUrl,
      referenceImageUrls,
      frameMode,
      prompt,
      duration: Number(duration) || 5,
      resolution: quality,
      audio,
      requestedModel,
      onStarted,
      onProgress,
      generationId,
      awaitCompletion,
    });

    return {
      ...result,
      userId,
    };
  }
}

module.exports = new VideoGenerationService();
