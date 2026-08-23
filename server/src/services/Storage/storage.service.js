const fs = require("fs");
const path = require("path");

class StorageService {
  getFileInfo(file) {
    if (!file) {
      const error = new Error("No file uploaded");
      error.status = 400;
      throw error;
    }

    return {
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${file.filename}`,
    };
  }

  async deleteFile(fileName) {
    if (!fileName) {
      const error = new Error("File name is required");
      error.status = 400;
      throw error;
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      fileName
    );

    if (!fs.existsSync(filePath)) {
      const error = new Error("File not found");
      error.status = 404;
      throw error;
    }

    await fs.promises.unlink(filePath);

    return {
      success: true,
      message: "File deleted successfully",
    };
  }
}

module.exports = new StorageService();