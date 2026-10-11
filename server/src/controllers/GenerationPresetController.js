const prisma = require("../utils/prisma");

const MAX_SETTINGS_BYTES = 24000;
const TYPES = new Set(["image", "video"]);
const CATEGORIES = new Set(["Portrait", "Concept Art", "Product", "Illustration", "Character", "Social", "Cinematic", "Custom"]);
const RATIOS = new Set(["1:1", "16:9", "9:16", "4:3", "3:4"]);
const { getModelRegistry } = require("../services/Generation/modelRegistry");
const { MODEL_CAPABILITIES } = require("../providers/alibaba/wanVideo.provider");

function normalizedSettings(type, settings) {
  const result = { ...settings };
  // The generate form carries video-only controls even while the image tab is active.
  // They are not image preset settings and should not be persisted or validated there.
  if (type === "image") {
    delete result.duration;
    delete result.audio;
  } else if (result.duration != null) {
    result.duration = Number(result.duration);
  }
  return result;
}

function validVideoDuration(settings) {
  if (settings.duration == null) return true;
  const duration = Number(settings.duration);
  if (!Number.isInteger(duration)) return false;
  if (settings.modelId && settings.modelId !== "auto") {
    const selected = getModelRegistry().find((model) => model.id === settings.modelId);
    const capability = selected && MODEL_CAPABILITIES[selected.apiModelId];
    if (capability) {
      return capability.durations === "range"
        ? duration >= capability.minDuration && duration <= capability.maxDuration
        : capability.durations.includes(duration);
    }
  }
  // Auto mode uses the configured model fallback chain. The generation endpoint
  // supports 2–15 second requests and maps them to each provider's capabilities.
  return duration >= 2 && duration <= 15;
}

function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Preset data is required.";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) return "Preset name must be between 1 and 80 characters.";
  if (!TYPES.has(body.type)) return "Preset type must be image or video.";
  if (!body.settings || typeof body.settings !== "object" || Array.isArray(body.settings)) return "Preset settings are required.";
  if (Buffer.byteLength(JSON.stringify(body.settings), "utf8") > MAX_SETTINGS_BYTES) return "Preset settings are too large.";
  const allowed = new Set(["prompt", "negativePrompt", "modelId", "ratio", "quality", "duration", "audio", "referenceImageIds", "characterId"]);
  if (Object.keys(body.settings).some((key) => !allowed.has(key))) return "Preset contains unsupported settings.";
  if (typeof body.settings.prompt !== "string" || body.settings.prompt.length > 15000) return "Preset prompt must be under 15000 characters.";
  if (body.settings.negativePrompt != null && (typeof body.settings.negativePrompt !== "string" || body.settings.negativePrompt.length > 3000)) return "Negative prompt must be under 3000 characters.";
  if (body.settings.modelId != null && body.settings.modelId !== "auto" && (typeof body.settings.modelId !== "string" || body.settings.modelId.length > 120)) return "Preset model is invalid.";
  if (body.settings.referenceImageIds != null && (!Array.isArray(body.settings.referenceImageIds) || body.settings.referenceImageIds.length > 8 || body.settings.referenceImageIds.some((id) => typeof id !== "string" || id.length > 80))) return "Preset reference images are invalid.";
  if (body.settings.ratio != null && !RATIOS.has(body.settings.ratio)) return "Preset aspect ratio is invalid.";
  if (body.settings.quality != null && !new Set(body.type === "image" ? ["Standard", "High", "Ultra"] : ["720P", "1080P"]).has(body.settings.quality)) return "Preset quality is invalid.";
  if (body.type === "video" && !validVideoDuration(body.settings)) return "Preset duration is invalid.";
  if (body.type === "video" && body.settings.audio != null && typeof body.settings.audio !== "boolean") return "Preset audio setting is invalid.";
  if (body.settings.characterId != null && (body.type !== "image" || typeof body.settings.characterId !== "string" || body.settings.characterId.length > 80)) return "Preset character reference is invalid.";
  if (body.category != null && !CATEGORIES.has(body.category)) return "Preset category is invalid.";
  return null;
}

class GenerationPresetController {
  constructor(database = prisma) { this.prisma = database; }
  async hasOwnedReferences(userId, settings) {
    const ids = settings?.referenceImageIds || [];
    const images = ids.length ? await this.prisma.image.findMany({ where: { userId, id: { in: ids } }, select: { id: true } }) : [];
    if (images.length !== new Set(ids).size) return false;
    if (settings?.characterId) return Boolean(await this.prisma.character.findFirst({ where: { id: settings.characterId, userId }, select: { id: true } }));
    return true;
  }
  async list(req, res) {
    const presets = await this.prisma.generationPreset.findMany({ where: { userId: req.user.id }, orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }] });
    return res.json({ success: true, data: { presets } });
  }

  async create(req, res) {
    const error = validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    if (!await this.hasOwnedReferences(req.user.id, req.body.settings)) return res.status(403).json({ success: false, message: "Preset references must belong to your account." });
    const settings = normalizedSettings(req.body.type, req.body.settings);
    const preset = await this.prisma.generationPreset.create({ data: { userId: req.user.id, name: req.body.name.trim(), type: req.body.type, category: req.body.category || "Custom", settings } });
    return res.status(201).json({ success: true, data: { preset } });
  }

  async update(req, res) {
    const { id } = req.params;
    const existing = await this.prisma.generationPreset.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ success: false, message: "Preset not found." });
    if (req.body?.favorite !== undefined && Object.keys(req.body).length === 1 && typeof req.body.favorite === "boolean") {
      const preset = await this.prisma.generationPreset.update({ where: { id }, data: { favorite: req.body.favorite } });
      return res.json({ success: true, data: { preset } });
    }
    const error = validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    if (!await this.hasOwnedReferences(req.user.id, req.body.settings)) return res.status(403).json({ success: false, message: "Preset references must belong to your account." });
    const settings = normalizedSettings(req.body.type, req.body.settings);
    const preset = await this.prisma.generationPreset.update({ where: { id }, data: { name: req.body.name.trim(), type: req.body.type, category: req.body.category || "Custom", settings } });
    return res.json({ success: true, data: { preset } });
  }

  async remove(req, res) {
    const result = await this.prisma.generationPreset.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    if (!result.count) return res.status(404).json({ success: false, message: "Preset not found." });
    return res.json({ success: true, message: "Preset deleted." });
  }
}

module.exports = { GenerationPresetController, validatePreset: validate };
