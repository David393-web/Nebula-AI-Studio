const storageService = require("../services/Storage/storage.service");

class StorageController {
  async upload(req, res, next) {
    try {
      const file = storageService.getFileInfo(req.file);

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          file,
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