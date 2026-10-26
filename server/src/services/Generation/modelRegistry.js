const wanVideoProvider = require("../../providers/alibaba/wanVideo.provider");

function getModelRegistry(env = process.env) {
  const imageModel = env.REPLICATE_IMAGE_MODEL || "black-forest-labs/flux-2-pro";
  const imageReferencesSupported = imageModel.split(":")[0] === "black-forest-labs/flux-2-pro";
  const imageEnabled = env.REPLICATE_IMAGE_ENABLED !== "false" && Boolean(env.REPLICATE_API_TOKEN);
  const videoChain = [...wanVideoProvider.getAlibabaVideoModelChain(env), ...wanVideoProvider.getAlibabaReferenceVideoModelChain(env)];
  const videoEnabled = env.ALIBABA_VIDEO_ENABLED !== "false" && Boolean(env.DASHSCOPE_API_KEY)
    && (!env.VIDEO_PRIMARY_PROVIDER || env.VIDEO_PRIMARY_PROVIDER === "alibaba");
  const images = [{
    id: "replicate-flux2-pro", displayName: imageModel.toLowerCase().includes("flux-2-pro") ? "FLUX.2 Pro" : imageModel,
    provider: "Replicate", providerId: "replicate", apiModelId: imageModel, type: "image",
    availability: imageEnabled ? "configured" : "disabled", availabilityReason: imageEnabled ? null : "Image generation is disabled or not configured on the server.",
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"], resolutions: [], duration: null,
    referenceImages: imageReferencesSupported, maxReferenceImages: imageReferencesSupported ? 8 : 0, negativePrompt: false, audio: false, characterConsistency: false,
    capabilities: imageReferencesSupported ? ["References"] : [], featured: true,
  }];
  const videos = videoChain.map((apiModelId, index) => {
    const capability = wanVideoProvider.MODEL_CAPABILITIES[apiModelId];
    const audioSupported = capability.audio !== "none";
    return {
      id: `alibaba-${apiModelId}`, displayName: `Wan ${apiModelId.replace(/^wanx?/, "").replaceAll("-", " ")}`,
      provider: "Alibaba Cloud", providerId: "alibaba", apiModelId, type: "video",
      availability: videoEnabled ? "configured" : "disabled", availabilityReason: videoEnabled ? null : "Video generation is disabled or not configured on the server.",
      aspectRatios: [], resolutions: capability.resolutions,
      duration: capability.durations === "range" ? { min: capability.minDuration, max: capability.maxDuration } : { values: capability.durations },
      referenceImages: capability.protocol === "reference", maxReferenceImages: capability.protocol === "reference" ? 5 : 0, negativePrompt: false, audio: audioSupported, audioMode: capability.audio,
      characterConsistency: capability.protocol === "reference", capabilities: [capability.protocol === "reference" ? "Identity references" : "First frame", ...(audioSupported ? ["Audio"] : [])], featured: index === 0,
    };
  });
  return [...images, ...videos];
}

module.exports = { getModelRegistry };
