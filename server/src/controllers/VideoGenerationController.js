const videoGenerationService = require("../services/Generation/videoGeneration.service");
const videoService = require("../services/Video/video.service");
const videoStorageService = require("../services/Storage/videoStorage.service");
const creditsService = require("../services/Credits/credits.service");
const imageService = require("../services/Image/image.service");
const projectService = require("../services/Project/project.service");
const storyboardService = require("../services/Storyboard/storyboard.service");
const characterService = require("../services/Character/character.service");
const videoGenerationStatusService = require("../services/Generation/videoGenerationStatus.service");
const { getModelRegistry } = require("../services/Generation/modelRegistry");

const NO_VISIBLE_TEXT_INSTRUCTION = "No visible text, captions, subtitles, character labels, dialogue text, typography, UI, logos or written words in the generated scene. Character names are metadata only and must never appear in the video.";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeVisualPrompt(value, characterNames = []) {
  const sourceLines = String(value || "").replace(/[“”]/g, '"').split(/\r?\n/);
  const lines = [];
  let skippingDialogue = false;
  for (const line of sourceLines) {
    if (/^\s*(?:DIALOGUE|SPOKEN WORDS?|TRANSCRIPT|SUBTITLES?|CAPTIONS?|AUDIO)\s*:/i.test(line)) {
      skippingDialogue = true;
      continue;
    }
    if (skippingDialogue && /^\s*(?:SCENE|ACTION|NARRATION|CAMERA|VISUAL|STORY|REFERENCE|NOTES)\b[^:]*:/i.test(line)) skippingDialogue = false;
    if (!skippingDialogue) lines.push(line.replace(/"[^"\n]*"/g, ""));
  }
  let text = lines.join("\n");
  for (const name of [...new Set(characterNames.filter(Boolean))].sort((a, b) => b.length - a.length)) {
    text = text.replace(new RegExp(escapeRegExp(name.trim()), "gi"), "the referenced character");
  }
  return [text.trim(), NO_VISIBLE_TEXT_INSTRUCTION].filter(Boolean).join("\n\n");
}

class VideoGenerationController {
  async generate(req, res) {
    let chargedCredits = 0;
    let chargeCompleted = false;
    let userId;
    const idempotencyKey = req.get("Idempotency-Key");
    try {
      userId = req.user?.id || req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user could not be identified.",
        });
      }

      const { imageUrl, imageId, prompt, duration, quality, sceneId, projectId, audio, audioPrompt, sceneScript, characterIds: requestedCharacterIds, generationSource, modelId } =
        req.body;

      if (!imageUrl && !imageId) {
        return res.status(400).json({
          success: false,
          message: "Storyboard image URL is required.",
        });
      }

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: "Video prompt is required.",
        });
      }

      if (typeof prompt !== "string" || prompt.length > 15000) {
        return res.status(400).json({ success: false, message: "Video direction is too long." });
      }
      if (audioPrompt !== undefined && (typeof audioPrompt !== "string" || audioPrompt.length > 3000)) {
        return res.status(400).json({ success: false, message: "Voice and audio instructions must be under 3000 characters." });
      }
      const withAudio = audio !== false;
      let requestedModel;
      if (modelId && modelId !== "auto") {
        const selected = getModelRegistry().find((model) => model.id === modelId && model.type === "video");
        if (!selected || selected.availability !== "configured") return res.status(400).json({ success: false, message: "The selected video model is unavailable. Choose Auto or another configured model." });
        requestedModel = selected.apiModelId;
        if (withAudio && !selected.audio) return res.status(400).json({ success: false, message: "The selected video model does not support generated audio." });
      }
      let providerPrompt = "";

      let verifiedImageUrl = imageUrl;
      let validatedScene = null;
      if (imageId) {
        const image = await imageService.getImage(imageId, userId);
        verifiedImageUrl = image.url;
      }
      if (sceneId) {
        if (!projectId) return res.status(400).json({ success: false, message: "Storyboard generation requires its project ID." });
        await projectService.getProject(projectId, userId);
        validatedScene = await storyboardService.getOne(userId, sceneId);
        if (validatedScene.projectId !== projectId) return res.status(403).json({ success: false, message: "This scene does not belong to the selected project." });
        const metadata = validatedScene.metadata || {};
        const sceneImage = validatedScene.imageUrl || metadata.imageUrl || (metadata.generatedType === "image" ? metadata.generatedUrl || metadata.generatedImageUrl : null);
        const assignedImageId = metadata.imageId || null;
        if (!sceneImage && !assignedImageId) return res.status(400).json({ success: false, message: "Assign a source image to this scene before generating its video." });
        if (sceneImage && verifiedImageUrl !== sceneImage) return res.status(400).json({ success: false, message: "Video generation must use the source image assigned to this scene." });
        if (assignedImageId && imageId && assignedImageId !== imageId) return res.status(400).json({ success: false, message: "The selected image is not assigned to this scene." });
        const blocks = metadata.sceneScript?.blocks || [];
        if (JSON.stringify(sceneScript?.blocks || []) !== JSON.stringify(blocks)) return res.status(409).json({ success: false, message: "The scene script changed. Reload the scene before generating." });
        const submittedCharacterIds = Array.isArray(requestedCharacterIds) ? requestedCharacterIds : [];
        const characterRefs = metadata.sceneCharacters?.length ? metadata.sceneCharacters : metadata.characters?.length ? metadata.characters : metadata.character ? [metadata.character] : [];
        const savedCharacterIds = characterRefs.map((character) => typeof character === "string" ? character : character?.id || character?.characterId).filter(Boolean);
        if (!savedCharacterIds.length) for (const id of blocks.filter((block) => ["character", "action", "dialogue"].includes(block.type)).map((block) => block.characterId).filter(Boolean)) if (!savedCharacterIds.includes(id)) savedCharacterIds.push(id);
        if (savedCharacterIds.length && (savedCharacterIds.length !== submittedCharacterIds.length || savedCharacterIds.some((id, index) => id !== submittedCharacterIds[index]))) return res.status(400).json({ success: false, message: "Video generation characters must match the saved characters on this scene." });
        const visualCharacterNames = [...characterRefs.map((character) => typeof character === "object" ? character?.name || character?.characterName : ""), ...blocks.map((block) => block.characterName)].filter(Boolean);
        for (const id of submittedCharacterIds) {
          const character = await characterService.getCharacter(id, userId);
          if (character.projectId && character.projectId !== projectId) return res.status(400).json({ success: false, message: "A selected character is not available to this project." });
          if (character.name) visualCharacterNames.push(character.name);
        }
        providerPrompt = sanitizeVisualPrompt(prompt, visualCharacterNames);
        console.info("Storyboard video generation context", { projectId, sceneId, characterIds: submittedCharacterIds, scriptBlockIds: blocks.map((block) => block.id).filter(Boolean), generationSource: "storyboard" });
      } else {
        providerPrompt = sanitizeVisualPrompt(prompt);
      }
      if (projectId && !sceneId) await projectService.getProject(projectId, userId);

      const requestedDuration = Math.min(15, Math.max(2, Math.round(Number(duration) || 5)));
      chargedCredits = creditsService.creditCost(withAudio ? "videoAudio" : "videoSilent", requestedDuration);
      await creditsService.preflight(userId, chargedCredits, idempotencyKey);
      videoGenerationStatusService.update(userId, idempotencyKey, { state: "starting" });

      const result = await videoGenerationService.generate({
        userId,
        imageUrl: verifiedImageUrl,
        prompt: providerPrompt,
        duration,
        quality,
        audio: withAudio,
        requestedModel,
        generationId: idempotencyKey,
        onProgress: async (progress) => videoGenerationStatusService.update(userId, idempotencyKey, progress),
        onStarted: async ({ taskId, model }) => {
          if (chargeCompleted) return;
          await creditsService.charge(userId, chargedCredits, idempotencyKey, `${model} ${withAudio ? "audio requested" : "silent"} video (${requestedDuration}s)`, taskId);
          chargeCompleted = true;
        },
      });

      const storedVideo = await videoStorageService.saveFromUrl(result.url);
      const publicBaseUrl = (
        process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`
      ).replace(/\/$/, "");
      const video = await videoService.createVideo({
        name: `AI video ${new Date().toISOString()}`,
        prompt: providerPrompt,
        url: `${publicBaseUrl}${storedVideo.path}`,
        duration: Math.round(Number(result.duration) || 0),
        metadata: {
          provider: result.provider,
          model: result.model,
          taskId: result.taskId,
          requestId: result.requestId,
          sceneId: sceneId || null,
          audio: result.audioGenerated,
          audioRequested: result.audioRequested,
          audioGenerated: result.audioGenerated,
          requestedDuration: result.requestedDuration,
          requestedResolution: result.requestedResolution,
          actualResolution: result.actualResolution,
          attemptedModels: result.attemptedModels,
          selectedModel: result.selectedModel,
          fallbackUsed: result.fallbackUsed,
          skippedModels: result.skippedModels,
          audioPrompt: audioPrompt?.trim() || null,
          generationSource: generationSource || (sceneId ? "storyboard" : "independent"),
          characterIds: Array.isArray(requestedCharacterIds) ? requestedCharacterIds : [],
          sceneScript: validatedScene?.metadata?.sceneScript || null,
        },
        projectId: projectId || null,
        userId,
      });

      videoGenerationStatusService.update(userId, idempotencyKey, {
        state: "completed",
        model: result.model,
        fallbackUsed: result.fallbackUsed,
        audioRequested: result.audioRequested,
        audioGenerated: result.audioGenerated,
      });

      return res.status(200).json({
        success: true,
        message: "Video generated successfully.",
        data: {
          ...result,
          ...video,
          sceneId: sceneId || null,
          projectId: projectId || null,
          audio: result.audioGenerated,
          audioRequested: result.audioRequested,
          audioGenerated: result.audioGenerated,
          requestedDuration: result.requestedDuration,
          requestedResolution: result.requestedResolution,
          actualResolution: result.actualResolution,
          attemptedModels: result.attemptedModels,
          selectedModel: result.selectedModel,
          fallbackUsed: result.fallbackUsed,
          skippedModels: result.skippedModels,
          audioPrompt: audioPrompt?.trim() || null,
        },
      });
    } catch (error) {
      videoGenerationStatusService.update(userId, idempotencyKey, { state: "failed" });
      if (chargeCompleted && chargedCredits && userId && idempotencyKey) {
        try { await creditsService.refund(userId, chargedCredits, idempotencyKey, "Video generation failed"); }
        catch (refundError) { console.error("Video generation refund failed", { code: refundError?.code || "INTERNAL_ERROR" }); }
      }
      console.error("Video generation failed", {
        provider: error?.provider || "unknown",
        status: error?.providerStatus || error?.status || 500,
        providerCode: error?.providerCode || null,
        providerMessage: error?.provider ? error.message : null,
        requestId: error?.requestId || null,
        classification: error?.classification || null,
        quotaExhausted: Boolean(error?.quotaExhausted),
        attemptedModels: error?.attemptedModels || null,
        skippedModels: error?.skippedModels || null,
      });

      const httpStatus = error?.status || (Number(error?.providerStatus) >= 400 ? error.providerStatus : 500);
      return res.status(httpStatus).json({
        success: false,
        message: error?.quotaExhausted
          ? error.message || "The video provider reports that its quota is exhausted."
          : error?.provider
            ? error.message || "The video provider rejected the request."
            : error?.status && error.status < 500
              ? error.message
              : "Video generation failed. Please try again later.",
        ...(error?.provider ? {
          provider: error.provider,
          providerStatus: error.providerStatus || null,
          providerCode: error.providerCode || null,
          requestId: error.requestId || null,
          model: error.model || "wan2.6-i2v-flash",
        } : {}),
      });
    }
  }

  getStatus(req, res) {
    const userId = req.user?.id || req.user?.userId;
    const status = videoGenerationStatusService.get(userId, req.params.requestId);
    if (!status) return res.status(404).json({ success: false, message: "Generation status was not found." });
    return res.status(200).json({ success: true, data: status });
  }
}

module.exports = new VideoGenerationController();
