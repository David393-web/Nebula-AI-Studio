const videoService = require("../services/Video/video.service");

const {
  validateVideoCreate,
  validateVideoUpdate,
} = require("../validators/video.validator");

class VideoController {
  // CREATE VIDEO
  async create(req, res, next) {
    try {
      const { isValid, errors } = validateVideoCreate(req.body);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const {
        name,
        prompt,
        url,
        thumbnailUrl,
        duration,
        metadata,
        projectId,
        isFavorite,
      } = req.body;

      const video = await videoService.createVideo({
        name,
        prompt,
        url,
        thumbnailUrl,
        duration,
        metadata,
        projectId,
        isFavorite,
        userId: req.user.userId,
      });

      return res.status(201).json({
        success: true,
        message: "Video created successfully",
        data: {
          video,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET ALL VIDEOS
  async getAll(req, res, next) {
    try {
      const videos = await videoService.getVideos(
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          videos,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET VIDEOS BY PROJECT
  async getByProject(req, res, next) {
    try {
      const videos = await videoService.getProjectVideos(
        req.params.projectId,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          videos,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET SINGLE VIDEO
  async getOne(req, res, next) {
    try {
      const video = await videoService.getVideo(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          video,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // UPDATE VIDEO
  async update(req, res, next) {
    try {
      const { isValid, errors } = validateVideoUpdate(
        req.body
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const video = await videoService.updateVideo(
        req.params.id,
        req.user.userId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Video updated successfully",
        data: {
          video,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE VIDEO
  async delete(req, res, next) {
    try {
      await videoService.deleteVideo(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Video deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VideoController();