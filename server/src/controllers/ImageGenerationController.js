const imageGenerationService = require(
  "../services/Generation/imageGeneration.service",
);
const storageService = require("../services/Storage/storage.service");
const imageService = require("../services/Image/image.service");
const creditsService = require("../services/Credits/credits.service");

class ImageGenerationController {
  async generate(req, res) {
    let chargedCredits = 0;
    let chargeCompleted = false;
    const userId = req.user?.id || req.user?.userId;
    const idempotencyKey = req.get("Idempotency-Key");
    try {
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
        projectId,
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image prompt is required.",
        });
      }

      chargedCredits = creditsService.creditCost("image");
      await creditsService.charge(userId, chargedCredits, idempotencyKey, "FLUX.2 Pro image generation", idempotencyKey);
      chargeCompleted = true;

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
      const image = await imageService.createImage({
        name: prompt.trim().slice(0, 80) || "Generated image",
        prompt: prompt.trim(),
        url: `${publicBaseUrl}${storedImage.path}`,
        metadata: { provider: result.provider, model: result.model, ratio, quality },
        userId,
        projectId: projectId || null,
      });

      return res.status(200).json({
        success: true,
        message: "Image generated successfully.",
        data: {
          ...image,
          provider: result.provider,
          model: result.model,
          sceneId: sceneId || null,
          projectId: projectId || null,
        },
      });
    } catch (error) {
      if (chargeCompleted && chargedCredits && userId && idempotencyKey) {
        try { await creditsService.refund(userId, chargedCredits, idempotencyKey, "Image generation failed"); }
        catch (refundError) { console.error("Image generation refund failed", { code: refundError?.code || "INTERNAL_ERROR" }); }
      }
      console.error("Image generation failed", { provider: "replicate", code: error?.code || "INTERNAL_ERROR" });
      return res.status(error?.status || 500).json({
        success: false,
        message: error?.status && error.status < 500 ? error.message : "Image generation failed. Please try again later.",
      });
    }
  }
}

module.exports =
  new ImageGenerationController();
