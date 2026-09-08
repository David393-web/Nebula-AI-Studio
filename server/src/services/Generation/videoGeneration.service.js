const ltxVideoProvider = require(
  "../../providers/huggingface/wanVideoSpace.provider",
);

class VideoGenerationService {
  async generate({
    userId,
    imageUrl,
    prompt,
    duration,
    aspectRatio,
  }) {
    if (!userId) {
      throw new Error(
        "Authenticated user is required.",
      );
    }

    if (!imageUrl) {
      throw new Error(
        "Storyboard image is required.",
      );
    }

    if (!prompt) {
      throw new Error(
        "Video prompt is required.",
      );
    }

    const result =
      await ltxVideoProvider.generateVideo({
        imageUrl,
        prompt,
        duration:
          Number(duration) || 3.5,
        aspectRatio:
          aspectRatio || "16:9",
      });

    return {
      ...result,
      userId,
    };
  }
}

module.exports =
  new VideoGenerationService();