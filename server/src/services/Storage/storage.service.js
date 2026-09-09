const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

class StorageService {
  async saveRemoteImage(imageUrl) {
    const response = await fetch(imageUrl);

    if (!response.ok || !response.body) {
      throw new Error(
        `Generated image could not be downloaded. HTTP ${response.status}.`,
      );
    }

    const contentType = (response.headers.get("content-type") || "")
      .split(";", 1)[0]
      .toLowerCase();
    const extensions = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/bmp": "bmp",
    };
    const extension = extensions[contentType];

    if (!extension) {
      throw new Error("Generated image download did not return a supported image.");
    }

    const contentLength = Number(response.headers.get("content-length"));

    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      throw new Error("Generated image exceeds the 20 MB storage limit.");
    }

    const directory = path.join(process.cwd(), "uploads", "images");
    const fileName = `${randomUUID()}.${extension}`;
    const filePath = path.join(directory, fileName);
    let bytesWritten = 0;

    const sizeLimit = new Transform({
      transform(chunk, encoding, callback) {
        bytesWritten += chunk.length;

        if (bytesWritten > MAX_IMAGE_BYTES) {
          callback(new Error("Generated image exceeds the 20 MB storage limit."));
          return;
        }

        callback(null, chunk);
      },
    });

    await fs.promises.mkdir(directory, { recursive: true });

    try {
      await pipeline(
        Readable.fromWeb(response.body),
        sizeLimit,
        fs.createWriteStream(filePath),
      );
    } catch (error) {
      await fs.promises.unlink(filePath).catch(() => {});
      throw error;
    }

    return {
      path: `/uploads/images/${fileName}`,
      size: bytesWritten,
    };
  }

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
