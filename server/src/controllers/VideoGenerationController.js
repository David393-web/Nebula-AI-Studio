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
const providerImageInput = require("../utils/providerImageInput");
const publicMediaMetadata = require("../utils/publicMediaMetadata");

const NO_VISIBLE_TEXT_INSTRUCTION = "No visible text, captions, subtitles, character labels, dialogue text, typography, UI, logos or written words in the generated scene. Character names are metadata only and must never appear in the video.";

function publicVideo(video) {
  if (!video) return null;
  return { ...video, metadata: publicMediaMetadata(video.metadata) };
}

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
  async finalizeTask(video, taskResult, req) {
    const metadata = video.metadata || {};
    const storedVideo = await videoStorageService.saveFromUrl(taskResult.url, {
      userId: video.userId,
      generationId: metadata.generationId,
    });
    if (storedVideo.provider !== "supabase") {
      throw new Error("Video storage did not confirm a durable Supabase upload.");
    }
    const updated = await videoService.updateVideo(video.id, video.userId, {
      duration: Math.round(Number(taskResult.duration) || Number(metadata.requestedDuration) || 0),
      metadata: {
        ...metadata,
        state: "completed",
        completedAt: new Date().toISOString(),
        storageProvider: storedVideo.provider,
        storageBucket: storedVideo.bucket,
        storageKey: storedVideo.storageKey,
        localStorageKey: storedVideo.localStorageKey,
        storageSize: storedVideo.size,
        storageMimeType: storedVideo.mimeType,
        actualResolution: taskResult.resolution || metadata.requestedResolution,
        providerRequestId: taskResult.requestId || metadata.providerRequestId || null,
      },
    });
    return updated;
  }

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

      if (!idempotencyKey || !/^[A-Za-z0-9_-]{1,120}$/.test(idempotencyKey)) {
        return res.status(400).json({ success: false, message: "A valid Idempotency-Key header is required." });
      }
      const existingGeneration = await videoService.getGeneration(idempotencyKey, userId);
      if (existingGeneration) {
        const state = existingGeneration.metadata?.state || "submission_unknown";
        return res.status(202).json({ success: true, message: "This generation request already exists.", data: {
          generationId: idempotencyKey,
          videoId: existingGeneration.id,
          taskId: existingGeneration.metadata?.taskId || null,
          model: existingGeneration.metadata?.model || null,
          state,
          sceneId: existingGeneration.metadata?.sceneId || null,
          projectId: existingGeneration.metadata?.projectId || null,
          video: state === "completed" ? publicVideo(existingGeneration) : null,
        } });
      }

      const { imageUrl, imageId, prompt, duration, quality, sceneId, projectId, audio, audioPrompt, sceneScript, characterIds: requestedCharacterIds, referenceImageIds = [], generationSource, modelId, frameMode = "reference" } =
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
      if (!["reference", "first_frame"].includes(frameMode)) return res.status(400).json({ success: false, message: "Choose reference guidance or an explicit first frame." });

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
        if (frameMode === "reference" && !selected.characterConsistency) return res.status(400).json({ success: false, message: "The selected model supports first-frame image-to-video only. Switch to explicit first-frame mode or choose a reference-to-video model." });
        if (!selected.characterConsistency && ((Array.isArray(referenceImageIds) && referenceImageIds.length > 0) || (Array.isArray(requestedCharacterIds) && requestedCharacterIds.length > 0))) {
          return res.status(400).json({ success: false, message: "The selected model does not accept additional identity reference images. Remove those references or choose a reference-to-video model." });
        }
      }
      let providerPrompt = "";
      const referenceImageUrls = [];
      if (!Array.isArray(referenceImageIds) || referenceImageIds.length > 5 || referenceImageIds.some((id) => typeof id !== "string")) return res.status(400).json({ success: false, message: "Choose up to five valid video reference images." });
      for (const id of [...new Set(referenceImageIds)]) {
        const reference = await imageService.getImage(id, userId);
        referenceImageUrls.push(await providerImageInput(reference.url, userId, (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")));
      }

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
          if (!character.imageUrl) return res.status(422).json({ success: false, message: `The selected character “${character.name}” has no saved reference image. Add a reference image to the character before generating.` });
          if (character.name) visualCharacterNames.push(character.name);
          if (character.imageUrl) referenceImageUrls.push(await providerImageInput(character.imageUrl, userId, (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")));
        }
        if (frameMode === "reference" && verifiedImageUrl) referenceImageUrls.unshift(await providerImageInput(verifiedImageUrl, userId, (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")));
        providerPrompt = sanitizeVisualPrompt(prompt, visualCharacterNames);
        console.info("Storyboard video generation context", { projectId, sceneId, characterIds: submittedCharacterIds, scriptBlockIds: blocks.map((block) => block.id).filter(Boolean), generationSource: "storyboard" });
      } else {
        const submittedCharacterIds = Array.isArray(requestedCharacterIds) ? [...new Set(requestedCharacterIds.filter((id) => typeof id === "string"))] : [];
        if (submittedCharacterIds.length > 5) return res.status(400).json({ success: false, message: "Choose up to five video reference images." });
        for (const id of submittedCharacterIds) {
          const character = await characterService.getCharacter(id, userId);
          if (!character.imageUrl) return res.status(422).json({ success: false, message: `The selected character “${character.name}” has no saved reference image. Add a reference image to the character before generating.` });
          if (character.imageUrl) referenceImageUrls.push(await providerImageInput(character.imageUrl, userId, (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")));
        }
        if (frameMode === "reference" && verifiedImageUrl) referenceImageUrls.unshift(await providerImageInput(verifiedImageUrl, userId, (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")));
        providerPrompt = sanitizeVisualPrompt(prompt);
      }
      if (projectId && !sceneId) await projectService.getProject(projectId, userId);
      const uniqueReferenceImageUrls = [...new Set(referenceImageUrls)];
      if (uniqueReferenceImageUrls.length > 5) return res.status(400).json({ success: false, message: "Wan reference-to-video supports up to five reference images." });
      if (frameMode === "reference") {
        providerPrompt += uniqueReferenceImageUrls.length === 1
          ? "\n\nUse the reference image as visual guidance. Preserve the subject's face, skin tone, hairstyle, clothing, body features, and other defining details while generating moving footage. The reference image is not a video frame; generate the complete scene as video."
          : "\n\nUse Image 1, Image 2, and the remaining reference images as visual guidance in their supplied order. Preserve each subject's defining identity and generate moving footage; do not reproduce the reference images as still frames."
      } else if (referenceImageUrls.length) {
        providerPrompt += "\n\nStart from the explicitly selected first frame. Use the additional reference images only to preserve subject identity and visual details."
      }

      if (!videoStorageService.isDurableConfigured()) {
        return res.status(503).json({ success: false, message: "Persistent video storage is not configured. Please contact the workspace administrator." });
      }
      const requestedDuration = Math.min(15, Math.max(2, Math.round(Number(duration) || 5)));
      chargedCredits = creditsService.creditCost(withAudio ? "videoAudio" : "videoSilent", requestedDuration);
      await creditsService.preflight(userId, chargedCredits, idempotencyKey);
      const generationId = idempotencyKey;
      const videoId = idempotencyKey;
      const publicBaseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      let pendingVideo;
      try {
        pendingVideo = await videoService.createVideo({
          id: videoId,
          name: `Generating video ${new Date().toISOString()}`,
          prompt: providerPrompt,
          url: `${publicBaseUrl}/api/videos/${videoId}/media`,
          duration: requestedDuration,
          metadata: {
            state: "submitting",
            generationId,
            model: requestedModel || null,
            selectedModel: requestedModel || null,
            requestedModel: requestedModel || null,
            provider: "alibaba",
            requestedDuration,
            requestedResolution: quality === "1080P" ? "1080P" : "720P",
            audioRequested: withAudio,
            sceneId: sceneId || null,
            frameMode,
            generationSource: generationSource || (sceneId ? "storyboard" : "independent"),
            characterIds: Array.isArray(requestedCharacterIds) ? requestedCharacterIds : [],
            sceneScript: validatedScene?.metadata?.sceneScript || null,
            projectId: projectId || null,
            audioPrompt: audioPrompt?.trim() || null,
            nextPollAt: null,
            pollAttempts: 0,
            submittedAt: new Date().toISOString(),
          },
          projectId: projectId || null,
          userId,
        });
      } catch (createError) {
        const duplicate = await videoService.getGeneration(generationId, userId);
        if (duplicate) return res.status(202).json({ success: true, data: { generationId, videoId: duplicate.id, taskId: duplicate.metadata?.taskId || null, state: duplicate.metadata?.state || "submission_unknown" } });
        throw createError;
      }
      await creditsService.charge(userId, chargedCredits, idempotencyKey, `Alibaba video (${requestedDuration}s)`, generationId);
      chargeCompleted = true;
      pendingVideo = await videoService.updateVideo(videoId, userId, {
        metadata: { ...pendingVideo.metadata, state: "submitting", chargedCredits },
      });

      const result = await videoGenerationService.generate({
        userId,
        imageUrl: await providerImageInput(verifiedImageUrl, userId, (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")),
        referenceImageUrls: uniqueReferenceImageUrls,
        frameMode,
        prompt: providerPrompt,
        duration,
        quality,
        audio: withAudio,
        requestedModel,
        generationId,
        awaitCompletion: false,
        onProgress: async (progress) => videoGenerationStatusService.update(userId, idempotencyKey, progress),
        onStarted: async ({ taskId, model }) => {
          const current = await videoService.getVideo(videoId, userId);
          await videoService.updateVideo(videoId, userId, {
            metadata: {
              ...current.metadata,
              state: "pending",
              taskId,
              model,
              selectedModel: model,
              providerRequestId: null,
              nextPollAt: new Date(Date.now() + 15_000).toISOString(),
              acceptedAt: new Date().toISOString(),
            },
          });
        },
      });
      const accepted = await videoService.getVideo(videoId, userId);
      const acceptedMetadata = {
        ...accepted.metadata,
        state: "pending",
        taskId: result.taskId,
        model: result.model,
        selectedModel: result.selectedModel,
        providerRequestId: result.requestId || null,
        attemptedModels: result.attemptedModels,
        skippedModels: result.skippedModels,
        fallbackUsed: result.fallbackUsed,
        audioRequested: result.audioRequested,
        audioGenerated: result.audioGenerated,
        nextPollAt: new Date(Date.now() + 15_000).toISOString(),
        acceptedAt: new Date().toISOString(),
      };
      await videoService.updateVideo(videoId, userId, { metadata: acceptedMetadata });
      videoGenerationStatusService.update(userId, generationId, { state: "pending", model: result.model, taskId: result.taskId });
      return res.status(202).json({
        success: true,
        message: "Video task accepted. Check its status while Alibaba generates the video.",
        data: {
          generationId,
          videoId,
          taskId: result.taskId,
          model: result.model,
          state: "pending",
        },
      });
    } catch (error) {
      const providerTaskMayStillRun = error?.classification === "TASK_STILL_RUNNING"
        || error?.providerCode === "TaskTimeout"
        || (chargeCompleted && (Number(error?.providerStatus) >= 500 || !error?.providerStatus));
      let persisted = null;
      if (userId && idempotencyKey) {
        persisted = await videoService.getGeneration(idempotencyKey, userId).catch(() => null);
        if (persisted) {
          const state = providerTaskMayStillRun ? (persisted.metadata?.taskId || error?.taskId ? "uncertain" : "submission_unknown") : "failed";
          await videoService.updateVideo(persisted.id, userId, {
            metadata: {
              ...persisted.metadata,
              state,
              providerCode: error?.providerCode || null,
              providerStatus: error?.providerStatus || null,
              taskId: error?.taskId || persisted.metadata?.taskId || null,
              model: error?.model || persisted.metadata?.model || null,
              providerRequestId: error?.requestId || persisted.metadata?.providerRequestId || null,
              providerMessage: providerTaskMayStillRun
                ? error?.providerCode === "TASK_ID_PERSISTENCE_FAILED"
                  ? "Alibaba accepted this task, but the server could not confirm its task ID in storage. Do not resubmit; check status again or contact support with this generation ID."
                  : "Provider acceptance is uncertain. Check this generation status; do not submit it again."
                : error?.quotaExhausted ? error.message : "Video generation failed. Please try again.",
              nextPollAt: persisted.metadata?.taskId ? new Date(Date.now() + 30_000).toISOString() : null,
            },
          }).catch(() => {});
        }
      }
      videoGenerationStatusService.update(userId, idempotencyKey, {
        state: providerTaskMayStillRun ? (persisted?.metadata?.taskId ? "uncertain" : "submission_unknown") : "failed",
        model: error?.model || null,
        taskId: error?.taskId || null,
      });
      if (!providerTaskMayStillRun && chargeCompleted && chargedCredits && userId && idempotencyKey) {
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

      const httpStatus = providerTaskMayStillRun ? 202 : error?.status || (Number(error?.providerStatus) >= 400 ? error.providerStatus : 500);
      return res.status(httpStatus).json({
        success: providerTaskMayStillRun,
        message: providerTaskMayStillRun
          ? "Alibaba has not confirmed whether this video task finished. Your request may still be processing; check generation status before retrying to avoid duplicate charges."
          : error?.quotaExhausted
          ? error.message || "The video provider reports that its quota is exhausted."
          : error?.provider
            ? error.message || "The video provider rejected the request."
            : error?.status && error.status < 500
              ? error.message
              : "Video generation failed. Please try again later.",
        ...(providerTaskMayStillRun ? { data: {
          generationId: idempotencyKey,
          videoId: persisted?.id || null,
          taskId: persisted?.metadata?.taskId || error?.taskId || null,
          model: persisted?.metadata?.model || error?.model || null,
          state: persisted?.metadata?.state || "submission_unknown",
        } } : {}),
        ...(error?.provider ? {
          provider: error.provider,
          providerStatus: error.providerStatus || null,
          providerCode: error.providerCode || null,
          requestId: error.requestId || null,
          taskId: error.taskId || null,
          model: error.model || "wan2.6-i2v-flash",
        } : {}),
      });
    }
  }

  async getStatus(req, res) {
    const userId = req.user?.id || req.user?.userId;
    const generationId = req.params.requestId;
    const video = await videoService.getGeneration(generationId, userId);
    if (!video) return res.status(404).json({ success: false, message: "Generation status was not found." });
    const terminal = new Set(["completed", "failed", "expired", "submission_unknown"]);
    let metadata = video.metadata || {};
    const acceptedAt = Date.parse(metadata.acceptedAt || "");
    if (metadata.taskId && Number.isFinite(acceptedAt) && Date.now() - acceptedAt >= 24 * 60 * 60 * 1000 && !terminal.has(metadata.state)) {
      await creditsService.refund(userId, Number(metadata.chargedCredits) || 0, generationId, "Alibaba video task expired before media delivery");
      metadata = { ...metadata, state: "expired", nextPollAt: null, providerMessage: "Alibaba's 24-hour task record expired before a result could be recovered. No automatic resubmission was made." };
      await videoService.updateVideo(video.id, userId, { metadata });
    }
    if (metadata.state === "submitting") {
      const submittedAt = Date.parse(metadata.submittedAt || video.createdAt);
      if (!metadata.taskId && Date.now() - submittedAt > 30_000) {
        const wasCharged = await creditsService.hasCharge(generationId);
        metadata = wasCharged
          ? { ...metadata, state: "submission_unknown", providerMessage: "The server restarted while provider acceptance was being confirmed. Do not submit again; contact support with this generation ID." }
          : { ...metadata, state: "failed", providerMessage: "The server stopped before charging or submitting this video. No provider task was created; you can safely start a new request." };
        await videoService.updateVideo(video.id, userId, { metadata });
      }
    }
    if (!terminal.has(metadata.state) && metadata.taskId && ["pending", "running", "uncertain", "checking", "finalization_retry", "finalizing"].includes(metadata.state)) {
      const nextPollAt = Date.parse(metadata.nextPollAt || "");
      if (!Number.isFinite(nextPollAt) || Date.now() >= nextPollAt) {
        const claimed = await videoService.claimGenerationPoll(video, {
          ...metadata,
          state: metadata.state === "finalization_retry" ? "finalization_retry" : "checking",
          pollLeaseUntil: new Date(Date.now() + 20_000).toISOString(),
          nextPollAt: new Date(Date.now() + 20_000).toISOString(),
        });
        if (claimed) {
          try {
            const checked = await videoGenerationService.getTaskStatus(metadata.taskId, metadata.model);
            metadata = { ...(await videoService.getVideo(video.id, userId)).metadata };
            const attempts = (Number(metadata.pollAttempts) || 0) + 1;
            if (checked.status === "SUCCEEDED" && checked.result?.url) {
              metadata = { ...metadata, state: "finalizing", pollAttempts: attempts, nextPollAt: new Date(Date.now() + 5 * 60_000).toISOString(), providerMessage: "Alibaba completed the video. Saving it to your private media library." };
              await videoService.updateVideo(video.id, userId, { metadata });
              void this.finalizeTask(video, checked.result).catch(async () => {
                const latestVideo = await videoService.getVideo(video.id, userId).catch(() => null);
                if (!latestVideo || latestVideo.metadata?.state !== "finalizing") return;
                await videoService.updateVideo(video.id, userId, {
                  metadata: { ...latestVideo.metadata, state: "finalization_retry", nextPollAt: new Date(Date.now() + 30_000).toISOString(), providerMessage: "The video is ready; saving it to private storage will be retried automatically." },
                }).catch(() => {});
              });
            } else if (["FAILED", "CANCELED"].includes(checked.status)) {
              await creditsService.refund(userId, Number(metadata.chargedCredits) || 0, generationId, "Alibaba video task failed");
              metadata = { ...metadata, state: "failed", providerCode: checked.code, providerMessage: "Alibaba could not complete this video. Credits were returned; you can safely submit a new request.", terminalAt: new Date().toISOString() };
              await videoService.updateVideo(video.id, userId, { metadata });
            } else if (checked.status === "UNKNOWN") {
              const age = Date.now() - Date.parse(metadata.acceptedAt || metadata.submittedAt || video.createdAt);
              const expired = age >= 24 * 60 * 60 * 1000;
              if (expired) await creditsService.refund(userId, Number(metadata.chargedCredits) || 0, generationId, "Alibaba video task expired before media delivery");
              metadata = { ...metadata, state: expired ? "expired" : "uncertain", pollAttempts: attempts, nextPollAt: expired ? null : new Date(Date.now() + 60_000).toISOString(), providerMessage: expired ? "Alibaba's 24-hour task record expired before a result could be recovered. No automatic resubmission was made." : "Alibaba has not returned this task. It may still be processing; do not resubmit while its status is uncertain." };
              await videoService.updateVideo(video.id, userId, { metadata });
            } else {
              metadata = { ...metadata, state: checked.status === "RUNNING" ? "running" : "pending", pollAttempts: attempts, nextPollAt: new Date(Date.now() + 15_000).toISOString(), providerRequestId: checked.requestId || metadata.providerRequestId };
              await videoService.updateVideo(video.id, userId, { metadata });
            }
          } catch (pollError) {
            const backoff = pollError?.providerStatus === 429 ? 60_000 : 30_000;
            metadata = { ...metadata, state: "uncertain", nextPollAt: new Date(Date.now() + backoff).toISOString(), lastPollErrorCode: pollError?.providerCode || "NETWORK_ERROR", providerMessage: "Alibaba status could not be checked right now. This request will remain available for another status check; do not resubmit." };
            await videoService.updateVideo(video.id, userId, { metadata }).catch(() => {});
          }
        }
      }
    }
    const latest = await videoService.getVideo(video.id, userId);
    metadata = latest.metadata || {};
    const videoData = metadata.state === "completed" ? latest : null;
    const message = metadata.providerMessage || (metadata.state === "completed" ? "Video generation completed." : ["failed", "expired"].includes(metadata.state) ? "Video generation did not complete." : "Alibaba is generating your video. Check again shortly.");
    return res.status(200).json({ success: true, data: {
      generationId,
      videoId: latest.id,
      taskId: metadata.taskId || null,
      model: metadata.model || null,
      state: metadata.state || "submission_unknown",
      sceneId: metadata.sceneId || null,
      projectId: metadata.projectId || null,
      nextPollAt: metadata.nextPollAt || null,
      message,
      video: publicVideo(videoData),
    } });
  }
}

module.exports = new VideoGenerationController();
