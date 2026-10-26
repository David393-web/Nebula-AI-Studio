const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");
const getMediaStorageRoot = require("../../utils/mediaStorageRoot");
const retryTransient = require("../../utils/retryTransient");
const supabaseStorage = require("../../providers/storage/supabase.provider");

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

class VideoStorageService {
  isDurableConfigured() {
    try { return Boolean(supabaseStorage.getBucket()); }
    catch { return false; }
  }

  async saveFromUrl(videoUrl, { userId, generationId } = {}) {
    if (!this.isDurableConfigured()) {
      const error = new Error("Persistent video storage is not configured; generation cannot be safely completed.");
      error.status = 503;
      throw error;
    }
    const local = await retryTransient(async () => {
    const response = await fetch(videoUrl, { signal: AbortSignal.timeout(120000) });

    if (!response.ok || !response.body) {
      const error = new Error(`Generated video could not be downloaded. HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }

    const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();

    if (!contentType.startsWith("video/")) {
      throw new Error("Generated video download did not return a video file.");
    }

    const contentLength = Number(response.headers.get("content-length"));

    const maxVideoBytes = supabaseStorage.getConfiguredMaxFileBytes() || MAX_VIDEO_BYTES;
    if (Number.isFinite(contentLength) && contentLength > maxVideoBytes) {
      throw new Error(`Generated video exceeds the ${Math.ceil(maxVideoBytes / (1024 * 1024))} MB storage limit.`);
    }

    const ownerPart = userId && /^[a-zA-Z0-9_-]+$/.test(String(userId)) ? ["users", String(userId)] : [];
    const directory = path.join(getMediaStorageRoot(), "private", ...ownerPart, "videos");
    const fileName = `${randomUUID()}.mp4`;
    const filePath = path.join(directory, fileName);
    let bytesWritten = 0;

    const sizeLimit = new Transform({
      transform(chunk, encoding, callback) {
        bytesWritten += chunk.length;

        if (bytesWritten > maxVideoBytes) {
          callback(new Error(`Generated video exceeds the ${Math.ceil(maxVideoBytes / (1024 * 1024))} MB storage limit.`));
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
    }, { delayMs: 500 });
    const localStorageKey = path.relative(getMediaStorageRoot(), local.filePath).split(path.sep).join("/");
    if (this.isDurableConfigured()) {
      const objectGenerationId = /^[a-zA-Z0-9_-]{1,120}$/.test(String(generationId || "")) ? generationId : randomUUID();
      try {
        const uploaded = await supabaseStorage.uploadFile({
          filePath: local.filePath,
          objectPath: `users/${userId}/videos/${objectGenerationId}/${objectGenerationId}.mp4`,
          bucket: supabaseStorage.getBucket(),
          contentType: local.contentType,
          userId,
          generationId,
          upsert: true,
        });
        return { ...uploaded, storageKey: uploaded.objectPath, localStorageKey };
      } finally {
        await fs.promises.unlink(local.filePath).catch(() => {});
      }
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
}

module.exports = new VideoStorageService();
