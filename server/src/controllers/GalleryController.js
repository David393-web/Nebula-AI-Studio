const galleryService = require("../services/Gallery/gallery.service");

class GalleryController {
  async getAll(req, res, next) {
    try {
      const gallery = await galleryService.getGallery(
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: gallery,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByType(req, res, next) {
    try {
      const { type } = req.params;

      const gallery = await galleryService.getGalleryByType(
        req.user.userId,
        type
      );

      return res.status(200).json({
        success: true,
        data: gallery,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GalleryController();