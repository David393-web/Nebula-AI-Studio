const path = require("path");
const fs = require("fs/promises");
const imageService = require("../services/Image/image.service");
const imageGenerationService = require("../services/Generation/imageGeneration.service");
const storageService = require("../services/Storage/storage.service");
const creditsService = require("../services/Credits/credits.service");
const getMediaStorageRoot = require("../utils/mediaStorageRoot");
const { randomUUID } = require("crypto");
const providerImageInput = require("../utils/providerImageInput");

const OPERATIONS = new Set(["edit"]);

class ImageOperationController {
  async process(req, res) {
    const userId = req.user?.id || req.user?.userId;
    const { imageId, operation = "edit", prompt } = req.body || {};
    const key = req.get("Idempotency-Key");
    let charged = false;
    let cost = 0;
    try {
      if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
      if (!OPERATIONS.has(operation)) return res.status(400).json({ success: false, message: "Unsupported image operation." });
      if (!/^[a-zA-Z0-9_-]{1,80}$/.test(String(imageId || ""))) return res.status(400).json({ success: false, message: "Choose a valid source image." });
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 1200) return res.status(400).json({ success: false, message: "Enter an instruction (up to 1,200 characters)." });

      const source = await imageService.getImage(imageId, userId);
      const sourceUrl = new URL(source.url, process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`);
      const apiOrigin = new URL(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).origin;
      let providerImage;
      if (sourceUrl.origin === apiOrigin && sourceUrl.pathname.startsWith("/uploads/")) {
        const uploadRoot = getMediaStorageRoot();
        const relativePath = decodeURIComponent(sourceUrl.pathname.slice("/uploads/".length));
        const filePath = path.resolve(uploadRoot, relativePath);
        if (!filePath.startsWith(uploadRoot + path.sep)) return res.status(400).json({ success: false, message: "Invalid source image path." });
        providerImage = await fs.readFile(filePath);
      } else if (["https:", "http:"].includes(sourceUrl.protocol)) {
        providerImage = await providerImageInput(sourceUrl.toString(), userId, apiOrigin);
      } else {
        return res.status(400).json({ success: false, message: "This image format or storage location cannot be sent to the image provider." });
      }

      if (Buffer.isBuffer(providerImage) && providerImage.length > 20 * 1024 * 1024) return res.status(400).json({ success: false, message: "The selected image exceeds the 20 MB processing limit." });
      cost = creditsService.creditCost(operation);
      await creditsService.charge(userId, cost, key, `Image ${operation}`, key);
      charged = true;
      const instruction = `${prompt.trim()} Preserve the main subject and overall composition unless the instruction explicitly asks to change them.`;
      const results = await imageGenerationService.editImage({ userId, prompt: instruction, imageUrl: providerImage });
      const publicBaseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      const images = [];
      for (const result of results) {
        const saved = await storageService.saveRemoteImage(result.url);
        const imageIdForMedia = randomUUID();
        images.push(await imageService.createImage({
          id: imageIdForMedia,
          name: `${source.name || "Image"} · edited`,
          prompt: instruction,
          url: `${publicBaseUrl}/api/images/${imageIdForMedia}/media`,
          metadata: { provider: result.provider, model: result.model, providerUrl: result.url, storageKey: saved.storageKey, storageSize: saved.size, generationId: key || null, mediaType: "image", operation, sourceImageId: source.id },
          userId, projectId: source.projectId || null,
        }));
      }
      return res.json({ success: true, data: { images, operation, cost } });
    } catch (error) {
      if (charged && key) await creditsService.refund(userId, cost, key, `Image ${operation} failed`).catch((refundError) => console.error("Image operation refund failed", refundError?.code));
      console.error("Image operation failed", { operation, code: error?.code || "INTERNAL_ERROR" });
      return res.status(error.status || 500).json({ success: false, message: error.status && error.status < 500 ? error.message : "Image processing failed. Please try again later." });
    }
  }
}

module.exports = new ImageOperationController();
