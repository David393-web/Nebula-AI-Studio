const wanVideoProvider = require("../../providers/alibaba/wanVideo.provider");

class VideoGenerationService {
  async generate({ userId, imageUrl, prompt, duration, quality }) {
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
      prompt,
      duration: Number(duration) || 5,
      resolution: quality,
    });

    return {
      ...result,
      userId,
    };
  }
}

module.exports = new VideoGenerationService();
