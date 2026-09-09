const videoGenerationService = require("../services/Generation/videoGeneration.service");
const videoService = require("../services/Video/video.service");
const videoStorageService = require("../services/Storage/videoStorage.service");

class VideoGenerationController {
  async generate(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;

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
      console.error("Video generation failed:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Video generation failed.",
      });
    }
  }
}

module.exports = new VideoGenerationController();
