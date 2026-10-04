const videoGenerationService = require("../services/Generation/videoGeneration.service");
const videoService = require("../services/Video/video.service");
const videoStorageService = require("../services/Storage/videoStorage.service");
const creditsService = require("../services/Credits/credits.service");

class VideoGenerationController {
  async generate(req, res) {
    let chargedCredits = 0;
    let chargeCompleted = false;
    let userId;
    const idempotencyKey = req.get("Idempotency-Key");
    try {
      userId = req.user?.id || req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user could not be identified.",
        });
      }

      const { imageUrl, prompt, duration, quality, sceneId, projectId } =
        req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Storyboard image URL is required.",
        });
      }

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: "Video prompt is required.",
        });
      }

      const requestedDuration = Math.min(15, Math.max(2, Math.round(Number(duration) || 5)));
      chargedCredits = creditsService.creditCost("video", requestedDuration);
      await creditsService.charge(userId, chargedCredits, idempotencyKey, `Wan 2.6 I2V Flash video (${requestedDuration}s)`, idempotencyKey);
      chargeCompleted = true;

      const result = await videoGenerationService.generate({
        userId,
        imageUrl,
        prompt,
        duration,
        quality,
      });

      const storedVideo = await videoStorageService.saveFromUrl(result.url);
      const publicBaseUrl = (
        process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`
      ).replace(/\/$/, "");
      const video = await videoService.createVideo({
        name: `AI video ${new Date().toISOString()}`,
        prompt,
        url: `${publicBaseUrl}${storedVideo.path}`,
        duration: Math.round(Number(result.duration) || 0),
        metadata: {
          provider: result.provider,
          model: result.model,
          taskId: result.taskId,
          requestId: result.requestId,
          sceneId: sceneId || null,
        },
        projectId: projectId || null,
        userId,
      });

      return res.status(200).json({
        success: true,
        message: "Video generated successfully.",
        data: {
          ...result,
          ...video,
          sceneId: sceneId || null,
          projectId: projectId || null,
        },
      });
    } catch (error) {
      if (chargeCompleted && chargedCredits && userId && idempotencyKey) {
        try { await creditsService.refund(userId, chargedCredits, idempotencyKey, "Video generation failed"); }
        catch (refundError) { console.error("Video generation refund failed", { code: refundError?.code || "INTERNAL_ERROR" }); }
      }
      console.error("Video generation failed", {
        provider: error?.provider || "unknown",
        status: error?.providerStatus || error?.status || 500,
        quotaExhausted: Boolean(error?.quotaExhausted),
      });

      return res.status(error?.quotaExhausted ? 503 : error?.status || 500).json({
        success: false,
        message: error?.quotaExhausted
          ? "The configured video provider has no available quota, and no compatible fallback provider is configured."
          : error?.status && error.status < 500
            ? error.message
            : "Video generation failed. Please try again later.",
      });
    }
  }
}

module.exports = new VideoGenerationController();
