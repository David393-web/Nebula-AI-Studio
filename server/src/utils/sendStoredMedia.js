const fs = require("fs");
const path = require("path");
const getMediaStorageRoot = require("./mediaStorageRoot");
const supabaseStorage = require("../providers/storage/supabase.provider");

function localFile(media) {
  const metadata = media?.metadata || {};
  let key = metadata.localStorageKey;
  if (!key && metadata.storageProvider !== "supabase") key = metadata.storageKey;
  if (!key && typeof media?.url === "string") {
    try {
      const url = new URL(media.url, "http://nebula.local");
      if (url.pathname.startsWith("/uploads/")) {
        const legacyKey = decodeURIComponent(url.pathname.slice("/uploads/".length));
        if (!legacyKey.startsWith("private/")) key = legacyKey;
      }
    } catch { /* invalid legacy URL */ }
  }
  if (typeof key !== "string" || !key) return null;
  if (path.isAbsolute(key) || key.split(/[\\/]/).includes("..")) return null;
  if (key.startsWith("private/users/")) {
    if (!media?.userId || !key.startsWith(`private/users/${media.userId}/`)) return null;
  } else if (key.startsWith("private/")) {
    const isLegacyGeneratedKey = /^private\/(?:images|videos)\/[^/]+$/.test(key)
      && !metadata.localStorageKey
      && metadata.storageProvider !== "supabase";
    if (!isLegacyGeneratedKey) return null;
  }
  const root = getMediaStorageRoot();
  const filePath = path.resolve(root, key);
  if (!filePath.startsWith(`${root}${path.sep}`)) return null;
  return fs.existsSync(filePath) ? filePath : null;
}

function sendLocal(res, filePath, media, fallbackName, download) {
  const name = String(media?.name || fallbackName).replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 100) || fallbackName;
  const ext = path.extname(filePath).slice(0, 12);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  const mimeType = media?.metadata?.storageMimeType;
  if (mimeType) res.type(mimeType);
  else if (/\.mp4$/i.test(filePath)) res.type("video/mp4");
  else if (/\.webp$/i.test(filePath)) res.type("image/webp");
  return download
    ? res.download(filePath, `${name}${ext}`)
    : res.sendFile(filePath, { acceptRanges: true, lastModified: true, cacheControl: false }, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 500).end();
    });
}

async function sendStoredMedia(res, media, fallbackName, { download = false } = {}) {
  const metadata = media?.metadata || {};
  const isSupabase = metadata.storageProvider === "supabase";
  if (isSupabase) {
    if (metadata.ownerUserId && metadata.ownerUserId !== media.userId) {
      const error = new Error("The saved media owner metadata is invalid.");
      error.status = 403;
      throw error;
    }
    if (typeof metadata.storageKey !== "string" || !media?.userId || !metadata.storageKey.startsWith(`users/${media.userId}/`)) {
      const error = new Error("The saved media object does not belong to this user.");
      error.status = 403;
      throw error;
    }
    try {
      const bucket = metadata.storageBucket;
      const configuredBucket = supabaseStorage.getBucket();
      if (!bucket || bucket !== configuredBucket) {
        const error = new Error("The saved media storage location is invalid.");
        error.status = 403;
        throw error;
      }
      const stored = await supabaseStorage.downloadObject({
        bucket,
        objectPath: metadata.storageKey,
        userId: media.userId,
        maxBytes: supabaseStorage.getConfiguredMaxFileBytes(),
      });
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.type(stored.contentType || metadata.storageMimeType || "application/octet-stream");
      res.setHeader("Content-Length", String(stored.data.length));
      if (download) {
        const name = `${String(media?.name || fallbackName).replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 100) || fallbackName}${path.extname(metadata.storageKey || "")}`;
        res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      }
      return res.status(200).send(stored.data);
    } catch (error) {
      const fallback = localFile(media);
      if (fallback) return sendLocal(res, fallback, media, fallbackName, download);
      throw error;
    }
  }

  const filePath = localFile(media);
  if (filePath) return sendLocal(res, filePath, media, fallbackName, download);
  const error = new Error("This saved media file is unavailable. If its original file is missing, regenerate it.");
  error.status = 410;
  throw error;
}

module.exports = sendStoredMedia;
module.exports.localFile = localFile;
