import api from "@/services/api";

export async function generateAIImage({
  prompt,
  model,
  ratio,
  quality,
  sceneId,
  projectId,
  characterId,
  characterIds,
  sceneScript,
  generationSource,
  referenceImageIds,
}) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Image prompt is required.");
  }

  try {
    const response = await api.post("/generation/image", {
      prompt: prompt.trim(),
      model: model || "black-forest-labs/flux-2-pro",
      ratio: ratio || "1:1",
      quality: quality || "standard",
      sceneId: sceneId || null,
      projectId: projectId || null,
      characterId: characterId || null,
      characterIds: Array.isArray(characterIds) ? characterIds : characterId ? [characterId] : [],
      sceneScript: sceneScript || null,
      generationSource: generationSource || (sceneId ? "storyboard" : "independent"),
      referenceImageIds: Array.isArray(referenceImageIds) ? referenceImageIds : [],
    }, { timeout: 180000, headers: { "Idempotency-Key": crypto.randomUUID() } });

    const data = response.data?.data || response.data || null;

    if (!data?.url) {
      throw new Error(
        "Image generation completed but no image URL was returned.",
      );
    }

    return {
      id: data.id || null,
      url: data.url,
      type: data.type || "image",
      provider: data.provider || "replicate",
      model: data.model || model || null,
      sceneId: data.sceneId || sceneId || null,
      createdAt: data.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    const responseData = error.response?.data || {};
    const message =
      responseData.message ||
      error.message ||
      "Image generation failed.";

    const generationError = new Error(message, {
      cause: error,
    });
    generationError.status = error.response?.status || null;
    generationError.requestId = responseData.requestId || null;
    generationError.model = responseData.model || model || "black-forest-labs/flux-2-pro";
    generationError.phase = responseData.phase || null;
    generationError.providerStatus = responseData.providerStatus || null;
    generationError.code = responseData.code || null;
    generationError.provider = responseData.provider || null;
    generationError.providerCode = responseData.providerCode || null;
    generationError.moderationStage = responseData.moderationStage || null;
    generationError.creditRefunded = responseData.creditRefunded ?? null;

    if (import.meta.env.DEV) {
      console.error("Image generation request failed", {
        message,
        httpStatus: generationError.status,
        providerStatus: generationError.providerStatus,
        requestId: generationError.requestId,
        model: generationError.model,
        phase: generationError.phase,
        code: generationError.code,
        providerCode: generationError.providerCode,
        moderationStage: generationError.moderationStage,
      });
    }
    throw generationError;
  }
}
