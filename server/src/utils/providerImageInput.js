const fs = require("fs/promises");
const path = require("path");
const imageService = require("../services/Image/image.service");
const getMediaStorageRoot = require("./mediaStorageRoot");

const MIME_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".bmp": "image/bmp" };

async function providerImageInput(value, userId, baseUrl) {
  if (!value || typeof value !== "string") return value;
  let url;
  try { url = new URL(value, baseUrl); } catch { return value; }
  const privateMatch = url.pathname.match(/^\/api\/images\/([^/]+)\/media$/);
  const baseOrigin = new URL(baseUrl).origin;
  let storageKey;
  if (privateMatch) {
    const image = await imageService.getImage(decodeURIComponent(privateMatch[1]), userId);
    storageKey = image.metadata?.storageKey;
  } else if (url.origin === baseOrigin && url.pathname.startsWith("/uploads/")) {
    storageKey = decodeURIComponent(url.pathname.slice("/uploads/".length));
  } else {
    return value.startsWith("/") ? url.href : value;
  }
  if (!storageKey) {
    const error = new Error("The selected reference image is no longer available. Choose another image or regenerate it.");
    error.status = 410;
    throw error;
  }
  const root = getMediaStorageRoot();
  const filePath = path.resolve(root, storageKey);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    const error = new Error("The selected reference image has an invalid storage location.");
    error.status = 400;
    throw error;
  }
  const buffer = await fs.readFile(filePath);
  if (!buffer.length || buffer.length > 20 * 1024 * 1024) {
    const error = new Error("The selected reference image must be no larger than 20 MB.");
    error.status = 400;
    throw error;
  }
  const mime = MIME_TYPES[path.extname(filePath).toLowerCase()];
  if (!mime) {
    const error = new Error("The selected reference image format is not supported.");
    error.status = 400;
    throw error;
  }
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

module.exports = providerImageInput;
