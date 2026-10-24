const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");
const getMediaStorageRoot = require("../../utils/mediaStorageRoot");
const retryTransient = require("../../utils/retryTransient");

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

class VideoStorageService {
  async saveFromUrl(videoUrl) {
    return retryTransient(async () => {
    const response = await fetch(videoUrl, { signal: AbortSignal.timeout(120000) });

    if (!response.ok || !response.body) {
      const error = new Error(`Generated video could not be downloaded. HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("video/")) {
      throw new Error("Generated video download did not return a video file.");
    }

    const contentLength = Number(response.headers.get("content-length"));

    if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
      throw new Error("Generated video exceeds the 500 MB storage limit.");
    }

    const directory = path.join(getMediaStorageRoot(), "private", "videos");
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
      path: null,
      size: bytesWritten,
      storageKey: `private/videos/${fileName}`,
    };
    }, { delayMs: 500 });
  }
}

module.exports = new VideoStorageService();
