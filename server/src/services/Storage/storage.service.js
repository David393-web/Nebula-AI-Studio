const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");
const getMediaStorageRoot = require("../../utils/mediaStorageRoot");
const retryTransient = require("../../utils/retryTransient");
const supabaseStorage = require("../../providers/storage/supabase.provider");

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

class StorageService {
  async saveRemoteImage(imageUrl, { userId, generationId } = {}) {
    const local = await retryTransient(async () => {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) });

    if (!response.ok || !response.body) {
      const error = new Error(`Generated image could not be downloaded. HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
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

    const ownerPart = userId && /^[a-zA-Z0-9_-]+$/.test(String(userId)) ? ["users", String(userId)] : [];
    const directory = path.join(getMediaStorageRoot(), "private", ...ownerPart, "images");
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

    return { filePath, fileName, size: bytesWritten, contentType };
    });
    const localStorageKey = path.relative(getMediaStorageRoot(), local.filePath).split(path.sep).join("/");
    if (supabaseStorage.isConfigured()) {
      const objectGenerationId = /^[a-zA-Z0-9_-]{1,120}$/.test(String(generationId || "")) ? generationId : randomUUID();
      const uploaded = await supabaseStorage.uploadFile({
        filePath: local.filePath,
        objectPath: `users/${userId}/images/${objectGenerationId}/${local.fileName}`,
        bucket: supabaseStorage.getBucket(),
        contentType: local.contentType,
        userId,
        generationId,
      });
      return { ...uploaded, storageKey: uploaded.objectPath, localStorageKey };
    }
    return {
      path: null,
      size: local.size,
      storageKey: localStorageKey,
      localStorageKey,
      provider: "local",
      bucket: null,
      mimeType: local.contentType,
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

    if (path.basename(fileName) !== fileName || fileName.includes("private")) {
      const error = new Error("Only top-level uploaded files can be deleted here.");
      error.status = 400;
      throw error;
    }

    const root = getMediaStorageRoot();
    const filePath = path.resolve(root, fileName);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
      const error = new Error("Invalid file name.");
      error.status = 400;
      throw error;
    }

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
