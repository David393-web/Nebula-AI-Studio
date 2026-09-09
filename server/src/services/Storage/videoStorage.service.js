const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

class VideoStorageService {
  async saveFromUrl(videoUrl) {
    const response = await fetch(videoUrl);

    if (!response.ok || !response.body) {
      throw new Error(
        `Generated video could not be downloaded. HTTP ${response.status}.`,
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("video/")) {
      throw new Error("Generated video download did not return a video file.");
    }

    const contentLength = Number(response.headers.get("content-length"));

    if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
      throw new Error("Generated video exceeds the 500 MB storage limit.");
    }

    const directory = path.join(process.cwd(), "uploads", "videos");
    const fileName = `${randomUUID()}.mp4`;
    const filePath = path.join(directory, fileName);
    let bytesWritten = 0;

    const sizeLimit = new Transform({
      transform(chunk, encoding, callback) {
        bytesWritten += chunk.length;

        if (bytesWritten > MAX_VIDEO_BYTES) {
          callback(new Error("Generated video exceeds the 500 MB storage limit."));
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
      path: `/uploads/videos/${fileName}`,
      size: bytesWritten,
    };
  }
}

module.exports = new VideoStorageService();
