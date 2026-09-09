const imageGenerationService = require(
  "../services/Generation/imageGeneration.service",
);
const storageService = require("../services/Storage/storage.service");

class ImageGenerationController {
  async generate(req, res) {
    try {
      const userId =
        req.user?.id ||
        req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user could not be identified.",
        });
      }

      const {
        prompt,
        model,
        ratio,
        quality,
        sceneId,
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image prompt is required.",
        });
      }

      const result =
        await imageGenerationService.generate({
          userId,
          prompt,
          model,
          ratio,
          quality,
        });

      const storedImage = await storageService.saveRemoteImage(result.url);
      const publicBaseUrl = (
        process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`
      ).replace(/\/$/, "");

      return res.status(200).json({
        success: true,
        message: "Image generated successfully.",
        data: {
          ...result,
          url: `${publicBaseUrl}${storedImage.path}`,
          sceneId: sceneId || null,
        },
      });
    } catch (error) {
      console.error(
        "Image generation failed:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Image generation failed.",
      });
    }
  }
}

module.exports =
  new ImageGenerationController();
