const videoGenerationService = require("../services/Generation/videoGeneration.service");

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

      const { imageUrl, prompt, duration, aspectRatio, sceneId, projectId } =
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
        aspectRatio,
      });

      return res.status(200).json({
        success: true,
        message: "Video generated successfully.",
        data: {
          ...result,
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
