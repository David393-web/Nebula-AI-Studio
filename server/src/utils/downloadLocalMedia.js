const fs = require("fs");
const path = require("path");
const getMediaStorageRoot = require("./mediaStorageRoot");

function downloadLocalMedia(res, media, fallbackName) {
  const storageKey = media?.metadata?.storageKey;
  if (typeof storageKey === "string" && storageKey) {
    const root = getMediaStorageRoot();
    const filePath = path.resolve(root, storageKey);
    if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) {
      const error = new Error("The saved media file is unavailable. It may need to be regenerated.");
      error.status = 410;
      throw error;
    }
    const ext = path.extname(filePath).slice(0, 12);
    const base = String(media.name || fallbackName).replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 100);
    return res.download(filePath, `${base || fallbackName}${ext}`);
  }
  let pathname;
  try {
    pathname = new URL(media.url, "http://nebula.local").pathname;
  } catch {
    const error = new Error("This media file cannot be downloaded.");
    error.status = 422;
    throw error;
  }
  if (!pathname.startsWith("/uploads/")) {
    const error = new Error("This media file is stored remotely and cannot be downloaded here yet.");
    error.status = 422;
    throw error;
  }
  const root = getMediaStorageRoot();
  const filePath = path.resolve(root, decodeURIComponent(pathname.slice("/uploads/".length)));
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) {
    const error = new Error("The media file is no longer available.");
    error.status = 404;
    throw error;
  }
  const ext = path.extname(filePath).slice(0, 12);
  const base = String(media.name || fallbackName).replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 100);
  return res.download(filePath, `${base || fallbackName}${ext}`);
}

module.exports = downloadLocalMedia;
