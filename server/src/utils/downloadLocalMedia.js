const sendStoredMedia = require("./sendStoredMedia");

function downloadLocalMedia(res, media, fallbackName) {
  return sendStoredMedia(res, media, fallbackName, { download: true });
}

module.exports = downloadLocalMedia;
