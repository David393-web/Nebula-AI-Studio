const imageService = require("../services/Image/image.service");
const downloadLocalMedia = require("../utils/downloadLocalMedia");

class ImageController {
  async create(req, res, next) {
    try {
      const {
        name,
        prompt,
        url,
        thumbnailUrl,
        metadata,
        projectId,
      } = req.body;

      const image = await imageService.createImage({
        name,
        prompt,
        url,
        thumbnailUrl,
        metadata,
        projectId,
        userId: req.user.userId,
      });

      return res.status(201).json({
        success: true,
        message: "Image created successfully",
        data: {
          image,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const images = await imageService.getImages(
        req.user.userId,
      );

      return res.status(200).json({
        success: true,
        data: {
          images,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const { id } = req.params;

      const image = await imageService.getImage(
        id,
        req.user.userId,
      );

      return res.status(200).json({
        success: true,
        data: {
          image,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async download(req, res, next) {
    try {
      const image = await imageService.getImage(req.params.id, req.user.userId);
      return downloadLocalMedia(res, image, "nebula-image");
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const image = await imageService.updateImage(
        id,
        req.user.userId,
        req.body,
      );

      return res.status(200).json({
        success: true,
        message: "Image updated successfully",
        data: {
          image,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await imageService.deleteImage(
        id,
        req.user.userId,
      );

      return res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImageController();
