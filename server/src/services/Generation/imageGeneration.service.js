const replicateImageProvider = require(
  "../../providers/replicate/replicateImage.provider",
);

class ImageGenerationService {
  async generate({
    userId,
    prompt,
    model,
    ratio,
    quality,
  }) {
    if (!userId) {
      throw new Error("Authenticated user is required.");
    }

    if (!prompt || typeof prompt !== "string") {
      throw new Error("Image prompt is required.");
    }

    /*
     * We currently use FLUX.2 Pro as Nebula's
     * first production image provider.
     *
     * The frontend can continue sending its
     * current model selection. Provider/model
     * mapping can be expanded later.
     */
    const result =
      await replicateImageProvider.generateImage({
        prompt,
        aspectRatio: ratio || "1:1",
        outputQuality:
          quality === "high"
            ? 90
            : quality === "low"
              ? 70
              : 80,
      });

    return {
      ...result,
      userId,
      createdAt: new Date().toISOString(),
    };
  }
}

module.exports = new ImageGenerationService();