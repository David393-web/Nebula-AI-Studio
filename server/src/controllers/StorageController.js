const storageService = require("../services/Storage/storage.service");
const imageService = require("../services/Image/image.service");

class StorageController {
  async upload(req, res, next) {
    try {
      const file = storageService.getFileInfo(req.file);
      let image = null;
      if (req.file.mimetype.startsWith("image/")) {
        const baseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
        image = await imageService.createImage({
          name: req.file.originalname.replace(/\.[^.]+$/, "") || "Uploaded image",
          url: `${baseUrl}${file.url}`,
          metadata: { source: "upload", originalName: req.file.originalname },
          userId: req.user.userId,
        });
      }

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          file,
          ...(image ? { image } : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { fileName } = req.params;

      const result = await storageService.deleteFile(
        fileName
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StorageController();
