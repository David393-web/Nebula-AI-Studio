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
          String(quality || "standard").toLowerCase() === "ultra"
            ? 90
            : String(quality || "standard").toLowerCase() === "standard"
              ? 70
              : 80,
      });

    return {
      ...result,
      userId,
      createdAt: new Date().toISOString(),
    };
  }

  async editImage({ userId, prompt, imageUrl, variations = 1 }) {
    if (!userId || !imageUrl || typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("An image and a clear editing instruction are required.");
    }
    const count = Math.max(1, Math.min(4, Number(variations) || 1));
    const results = [];
    for (let index = 0; index < count; index += 1) {
      const result = await replicateImageProvider.generateImage({
        prompt: prompt.trim(), aspectRatio: "match_input_image", inputImages: [imageUrl],
      });
      results.push(result);
    }
    return results;
  }
}

module.exports = new ImageGenerationService();
