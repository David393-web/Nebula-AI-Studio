const imageGenerationService = require(
  "../services/Generation/imageGeneration.service",
);
const storageService = require("../services/Storage/storage.service");
const imageService = require("../services/Image/image.service");
const creditsService = require("../services/Credits/credits.service");
const characterService = require("../services/Character/character.service");
const storyboardService = require("../services/Storyboard/storyboard.service");
const projectService = require("../services/Project/project.service");
const { randomUUID } = require("crypto");
const providerImageInput = require("../utils/providerImageInput");

function getSavedSceneCharacterIds(scene) {
  const metadata = scene?.metadata || {};
  const saved = metadata.sceneCharacters?.length ? metadata.sceneCharacters : metadata.characters?.length ? metadata.characters : metadata.character ? [metadata.character] : [];
  const blocks = metadata.sceneScript?.blocks || [];
  const ids = [];
  for (const item of saved) {
    const id = typeof item === "string" ? item : item?.id || item?.characterId;
    if (id && !ids.includes(id)) ids.push(id);
  }
  if (!saved.length) for (const block of blocks) {
    if (["character", "action", "dialogue"].includes(block?.type) && block.characterId && !ids.includes(block.characterId)) ids.push(block.characterId);
  }
  return ids;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeVisualText(value, characterNames = []) {
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
  return text.replace(/\s+/g, " ").trim();
}

function formatSceneScript(blocks = [], characterNames = []) {
  const labels = { action: "Action", narration: "Narrative context", camera: "Camera" };
  return blocks
    .filter((block) => ["action", "narration", "camera"].includes(block?.type))
    .map((block) => {
      const value = sanitizeVisualText(block.text, characterNames);
      return value ? `${labels[block.type]}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

class ImageGenerationController {
  async generate(req, res) {
    let chargedCredits = 0;
    let chargeCompleted = false;
    let creditRefunded = false;
    let phase = "request_validation";
    let selectedModel = process.env.REPLICATE_IMAGE_MODEL || "black-forest-labs/flux-2-pro";
    const selectedCharacters = [];
    const userId = req.user?.id || req.user?.userId;
    const idempotencyKey = req.get("Idempotency-Key");
    try {
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user could not be identified.",
        });
      }

      const {
        prompt,
        model,
        ratio,
        quality,
        sceneId,
        projectId,
        characterId,
        characterIds: requestedCharacterIds,
        sceneScript: requestedSceneScript,
        generationSource,
        referenceImageIds,
      } = req.body;
      selectedModel = process.env.REPLICATE_IMAGE_MODEL || model || selectedModel;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image prompt is required.",
        });
      }

      const characterIds = Array.isArray(requestedCharacterIds) ? requestedCharacterIds.filter((value) => typeof value === "string") : characterId ? [characterId] : [];
      let finalPrompt = prompt.trim();
      let savedScene = null;
      if (sceneId) {
        phase = "storyboard_validation";
        if (!projectId) return res.status(400).json({ success: false, message: "Storyboard generation requires its project ID." });
        await projectService.getProject(projectId, userId);
        savedScene = await storyboardService.getOne(userId, sceneId);
        if (savedScene.projectId !== projectId) return res.status(400).json({ success: false, message: "The selected scene does not belong to this project." });
        const savedCharacterIds = getSavedSceneCharacterIds(savedScene);
        if (savedCharacterIds.length && (savedCharacterIds.length !== characterIds.length || savedCharacterIds.some((id, index) => id !== characterIds[index]))) {
          return res.status(400).json({ success: false, message: "Generation characters must match the saved characters on this scene." });
        }
        for (const id of characterIds) {
          const character = await characterService.getCharacter(id, userId);
          if (character.projectId && character.projectId !== projectId) return res.status(400).json({ success: false, message: "A selected character is not available to this project." });
          if (!character.imageUrl) return res.status(422).json({ success: false, message: `The selected character “${character.name}” has no saved reference image. Add a reference image to the character before generating.` });
          selectedCharacters.push(character);
        }
        const savedBlocks = savedScene.metadata?.sceneScript?.blocks || [];
        if (JSON.stringify(requestedSceneScript?.blocks || []) !== JSON.stringify(savedBlocks)) return res.status(409).json({ success: false, message: "The scene script changed. Reload the scene before generating." });
        const visualNames = [...selectedCharacters.map((character) => character.name), ...savedBlocks.map((block) => block.characterName)].filter(Boolean);
        finalPrompt = sanitizeVisualText(prompt, visualNames);
        const scriptPrompt = formatSceneScript(savedBlocks, visualNames);
        if (scriptPrompt) finalPrompt += `\n\nSCENE ACTION, NARRATIVE AND CAMERA CONTEXT (dialogue is reserved for audio):\n${scriptPrompt}`;
      console.info("Storyboard image generation context", { projectId, sceneId, characterNames: selectedCharacters.map((character) => character.name), scriptBlockCount: savedBlocks.length, generationSource: "storyboard" });
      } else if (projectId) {
        phase = "project_validation";
        await projectService.getProject(projectId, userId);
      }

      phase = "reference_collection";
      const mediaBaseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      const toAbsoluteUrl = (url) => url?.startsWith("/") ? `${mediaBaseUrl}${url}` : url;
      const referenceImageUrls = [];
      if (!savedScene && Array.isArray(referenceImageIds)) {
        if (referenceImageIds.length > 8 || referenceImageIds.some((id) => typeof id !== "string")) return res.status(400).json({ success: false, message: "Choose up to 8 valid reference images." });
        for (const id of [...new Set(referenceImageIds)]) {
          const reference = await imageService.getImage(id, userId);
          referenceImageUrls.push(await providerImageInput(reference.url, userId, mediaBaseUrl));
        }
      } else if (referenceImageIds != null && !Array.isArray(referenceImageIds)) {
        return res.status(400).json({ success: false, message: "Reference images must be a list of saved image IDs." });
      }
      if (savedScene) {
        const metadata = savedScene.metadata || {};
        const sceneSource = savedScene.imageUrl || metadata.imageUrl || (metadata.generatedType === "image" ? metadata.generatedUrl || metadata.generatedImageUrl : null);
        if (sceneSource) referenceImageUrls.push(await providerImageInput(toAbsoluteUrl(sceneSource), userId, mediaBaseUrl));
        for (const id of characterIds) {
          const character = await characterService.getCharacter(id, userId);
          if (character.imageUrl) referenceImageUrls.push(await providerImageInput(toAbsoluteUrl(character.imageUrl), userId, mediaBaseUrl));
        }
        if (sceneSource && characterIds.length) {
          finalPrompt += "\n\nREFERENCE USE: The first reference is the storyboard scene image and defines scene composition and environment. Additional character images are visual identity references only (face, appearance, clothing, hair, colors, accessories and body design). Do not recreate a character card, sheet, poster, layout, labels or its background.";
        } else if (characterIds.length) {
          finalPrompt += "\n\nREFERENCE USE: Attached character images are visual identity references only (face, appearance, clothing, hair, colors, accessories and body design). Do not recreate a character card, sheet, poster, layout, labels or its background.";
        }
      } else {
        const referenceCharacterId = characterIds[0] || characterId;
        if (referenceCharacterId) {
          const character = await characterService.getCharacter(referenceCharacterId, userId);
          if (!character.imageUrl) return res.status(422).json({ success: false, message: `The selected character “${character.name}” has no saved reference image. Add a reference image to the character before generating.` });
          selectedCharacters.push(character);
          if (character.imageUrl) referenceImageUrls.push(await providerImageInput(toAbsoluteUrl(character.imageUrl), userId, mediaBaseUrl));
          finalPrompt = sanitizeVisualText(finalPrompt, [character.name]);
          finalPrompt += "\n\nREFERENCE USE: The attached character image is a visual identity reference only (face, appearance, clothing, hair, colors, accessories and body design). Do not recreate a character card, sheet, poster, layout, labels or its background.";
        }
      }

      finalPrompt += "\n\nNo visible text, captions, subtitles, character labels, dialogue text, typography, UI, logos or written words in the generated scene. Character names are metadata only and must never appear in the image.";
      const uniqueReferenceImageUrls = [...new Set(referenceImageUrls)];
      if (uniqueReferenceImageUrls.length > 8) return res.status(400).json({ success: false, message: "Choose up to eight reference images, including character images." });

      phase = "credit_charge";
      chargedCredits = creditsService.creditCost("image");
      await creditsService.charge(userId, chargedCredits, idempotencyKey, "FLUX.2 Pro image generation", idempotencyKey);
      chargeCompleted = true;

      phase = "provider_generation";
      if (process.env.NODE_ENV !== "production") {
        const safePrompt = finalPrompt
          .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
          .replace(/\b(?:r8|sk|hf)_[A-Za-z0-9_-]{12,}\b/gi, "[redacted]")
          .replace(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, "data:image/[redacted]");
        console.debug("Replicate image generation request", {
          requestId: idempotencyKey || null,
          model: selectedModel,
          promptLength: safePrompt.length,
          prompt: safePrompt,
          characterCount: selectedCharacters.length,
          characterNames: selectedCharacters.map((character) => character.name),
          hasReferenceImages: referenceImageUrls.length > 0,
          referenceImageCount: uniqueReferenceImageUrls.length,
          aspectRatio: ratio || "1:1",
          quality: quality || "standard",
          sceneId: sceneId || null,
        });
      }
      const result = await imageGenerationService.generate({
        userId,
        prompt: finalPrompt,
        model,
        ratio,
        quality,
        referenceImageUrls: uniqueReferenceImageUrls,
      });

      phase = "image_download";
      const generationId = idempotencyKey || randomUUID();
      const storedImage = await storageService.saveRemoteImage(result.url, { userId, generationId });
      const publicBaseUrl = (
        process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`
      ).replace(/\/$/, "");
      const imageId = randomUUID();
      const image = await imageService.createImage({
        id: imageId,
        name: finalPrompt.slice(0, 80) || "Generated image",
        prompt: finalPrompt,
        url: `${publicBaseUrl}/api/images/${imageId}/media`,
        metadata: { provider: result.provider, model: result.model, providerUrl: result.url, storageProvider: storedImage.provider, storageBucket: storedImage.bucket, storageKey: storedImage.storageKey, localStorageKey: storedImage.localStorageKey, storageSize: storedImage.size, storageMimeType: storedImage.mimeType, ownerUserId: userId, generationId, mediaType: "image", ratio, quality, characterIds, sceneId: sceneId || null, generationSource: generationSource || (sceneId ? "storyboard" : "independent"), sceneScript: savedScene?.metadata?.sceneScript || null },
        userId,
        projectId: projectId || null,
      });

      return res.status(200).json({
        success: true,
        message: "Image generated successfully.",
        data: {
          ...image,
          provider: result.provider,
          model: result.model,
          sceneId: sceneId || null,
          projectId: projectId || null,
        },
      });
    } catch (error) {
      if (chargeCompleted && chargedCredits && userId && idempotencyKey) {
        try {
          await creditsService.refund(userId, chargedCredits, idempotencyKey, "Image generation failed");
          creditRefunded = true;
        } catch (refundError) {
          console.error("Image generation credit refund failed", {
            requestId: error?.requestId || idempotencyKey,
            code: refundError?.code || "INTERNAL_ERROR",
            message: String(refundError?.message || "Credit refund failed").slice(0, 500),
          });
        }
      }
      const requestId = error?.requestId || req.id || idempotencyKey || null;
      const development = process.env.NODE_ENV !== "production";
      const moderationRejected = error?.providerCode === "E005" || error?.code === "CONTENT_SAFETY_REJECTED";
      const safeMessage = String(error?.message || "Image generation failed.")
        .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
        .replace(/r8_[A-Za-z0-9]+/g, "[redacted]")
        .replace(/https?:\/\/[^\s"']+\?[^\s"']+/gi, (url) => `${url.split("?")[0]}?[redacted]`)
        .replace(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, "data:image/[redacted]")
        .slice(0, 1000);
      const safeProviderMessage = String(error?.providerMessage || "")
        .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
        .replace(/\b(?:r8|sk|hf)_[A-Za-z0-9_-]{12,}\b/gi, "[redacted]")
        .replace(/https?:\/\/[^\s"']+\?[^\s"']+/gi, (url) => `${url.split("?")[0]}?[redacted]`)
        .slice(0, 1000);
      const responseStatus = moderationRejected ? 422 : error?.status || (error?.providerCallStarted ? 502 : 500);
      const responseCode = moderationRejected ? "CONTENT_SAFETY_REJECTED" : error?.providerCallStarted ? "PROVIDER_ERROR" : error?.code || "GENERATION_FAILED";
      console.error("Image generation failed", {
        requestId,
        phase: error?.providerCallStarted ? "provider_generation" : phase,
        provider: error?.provider || (phase === "provider_generation" ? "replicate" : null),
        model: error?.model || selectedModel,
        httpStatus: error?.providerStatus || null,
        providerCode: error?.providerCode || null,
        moderationStage: moderationRejected ? error?.moderationStage || "unspecified" : null,
        status: responseStatus,
        name: error?.name || "Error",
        code: error?.code || "INTERNAL_ERROR",
        message: safeProviderMessage || safeMessage,
        providerCallStarted: Boolean(error?.providerCallStarted),
        creditsCharged: chargeCompleted,
        creditRefunded,
      });
      return res.status(responseStatus).json({
        success: false,
        code: responseCode,
        provider: error?.provider || (error?.providerCallStarted ? "replicate" : null),
        ...(moderationRejected ? { providerCode: "E005", moderationStage: error?.moderationStage || "unspecified" } : {}),
        message: moderationRejected
          ? "Your image provider flagged this generation as sensitive. Try adjusting the visual description or reducing explicit violence, while keeping your story intact."
          : error?.providerCallStarted && !development
            ? "The image provider could not complete this generation. Please try again shortly."
          : error?.status && error.status < 500
          ? safeMessage
          : development
            ? safeMessage
            : "Image generation failed. Please try again later.",
        ...(development ? { requestId, model: selectedModel, phase: error?.providerCallStarted ? "provider_generation" : phase, providerStatus: error?.providerStatus || null, providerMessage: safeProviderMessage || null, moderationStage: moderationRejected ? error?.moderationStage || "unspecified" : null, creditsCharged: chargeCompleted, creditRefunded } : {}),
      });
    }
  }
}

module.exports =
  new ImageGenerationController();
