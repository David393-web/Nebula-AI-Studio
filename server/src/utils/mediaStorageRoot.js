const path = require("path");

function getMediaStorageRoot() {
  const configured = process.env.MEDIA_STORAGE_DIR?.trim();
  return configured ? path.resolve(configured) : path.resolve(process.cwd(), "uploads");
}

module.exports = getMediaStorageRoot;
