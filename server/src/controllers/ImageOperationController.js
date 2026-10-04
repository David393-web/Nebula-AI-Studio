const path = require("path");
const fs = require("fs/promises");
const imageService = require("../services/Image/image.service");
const imageGenerationService = require("../services/Generation/imageGeneration.service");
const storageService = require("../services/Storage/storage.service");
const creditsService = require("../services/Credits/credits.service");

const OPERATIONS = new Set(["edit", "variation", "relight"]);

class ImageOperationController {
  async process(req, res) {
    const userId = req.user?.id || req.user?.userId;
    const { imageId, operation = "edit", prompt, count = 1 } = req.body || {};
    const key = req.get("Idempotency-Key");
    let charged = false;
    let cost = 0;
    try {
      if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
      if (!OPERATIONS.has(operation)) return res.status(400).json({ success: false, message: "Unsupported image operation." });
      if (!/^[a-zA-Z0-9_-]{1,80}$/.test(String(imageId || ""))) return res.status(400).json({ success: false, message: "Choose a valid source image." });
      const n = operation === "variation" ? Number(count) : 1;
      if (![1, 2, 4].includes(n) || (operation !== "variation" && n !== 1)) return res.status(400).json({ success: false, message: "Choose one, two, or four variations." });
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 1200) return res.status(400).json({ success: false, message: "Enter an instruction (up to 1,200 characters)." });

      const source = await imageService.getImage(imageId, userId);
      const sourceUrl = new URL(source.url, process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`);
      const apiOrigin = new URL(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).origin;
      let providerImage;
      if (sourceUrl.origin === apiOrigin && sourceUrl.pathname.startsWith("/uploads/")) {
        const filename = path.basename(sourceUrl.pathname);
        const filePath = path.join(process.cwd(), "uploads", filename);
        providerImage = await fs.readFile(filePath);
      } else if (["https:", "http:"].includes(sourceUrl.protocol)) {
        providerImage = sourceUrl.toString();
      } else {
        return res.status(400).json({ success: false, message: "This image format or storage location cannot be sent to the image provider." });
      }

      cost = creditsService.creditCost(operation) * n;
      await creditsService.charge(userId, cost, key, `Image ${operation}`, key);
      charged = true;
      const instruction = operation === "relight" ? `Relight the provided image: ${prompt.trim()}. Preserve its subject and composition.` : operation === "variation" ? `Create a controlled visual variation of the provided image. Preserve its main subject and composition while exploring: ${prompt.trim()}` : prompt.trim();
      const results = await imageGenerationService.editImage({ userId, prompt: instruction, imageUrl: providerImage, variations: n });
      const publicBaseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      const images = [];
      for (const [index, result] of results.entries()) {
        const saved = await storageService.saveRemoteImage(result.url);
        images.push(await imageService.createImage({
          name: `${source.name || "Image"} · ${operation}${n > 1 ? ` ${index + 1}` : ""}`,
          prompt: instruction,
          url: `${publicBaseUrl}${saved.path}`,
          metadata: { provider: result.provider, model: result.model, operation, sourceImageId: source.id },
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
