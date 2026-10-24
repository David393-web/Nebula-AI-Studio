const fs = require("fs");
const path = require("path");
const getMediaStorageRoot = require("./mediaStorageRoot");

function sendStoredMedia(res, media, fallbackName) {
  const key = media?.metadata?.storageKey;
  if (typeof key !== "string" || !key) {
    const error = new Error("This saved media predates durable media storage. If its original file is unavailable, regenerate it.");
    error.status = 410;
    throw error;
  }
  const root = getMediaStorageRoot();
  const filePath = path.resolve(root, key);
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) {
    const error = new Error("The saved media file is unavailable. It may need to be regenerated.");
    error.status = 410;
    throw error;
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  if (/\.mp4$/i.test(filePath)) res.type("video/mp4");
  else if (/\.webp$/i.test(filePath)) res.type("image/webp");
  return res.sendFile(filePath, { acceptRanges: true, lastModified: true, cacheControl: false }, (error) => {
    if (error && !res.headersSent) res.status(error.statusCode || 500).end();
  });
}

module.exports = sendStoredMedia;
