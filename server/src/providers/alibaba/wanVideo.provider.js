const API_BASE_URL =
  process.env.DASHSCOPE_API_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/api/v1";

const DEFAULT_MODEL_CHAIN = Object.freeze([
  "wan2.6-i2v-flash",
  "wan2.7-i2v",
  "wan2.7-i2v-2026-04-25",
  "wan2.6-i2v",
  "wan2.5-i2v-preview",
  "wan2.2-i2v-plus",
  "wan2.2-i2v-flash",
  "wan2.1-i2v-plus",
  "wan2.1-i2v-turbo",
]);

// Alibaba's public API uses the wanx2.1 names for the Wan 2.1 I2V models.
const MODEL_ALIASES = Object.freeze({
  "wan2.1-i2v-plus": "wanx2.1-i2v-plus",
  "wan2.1-i2v-turbo": "wanx2.1-i2v-turbo",
});

const MODEL_CAPABILITIES = Object.freeze({
  "wan2.6-i2v-flash": { protocol: "legacy", promptLimit: 1500, durations: "range", minDuration: 2, maxDuration: 15, resolutions: ["720P", "1080P"], audio: "toggle" },
  "wan2.7-i2v": { protocol: "media", promptLimit: 5000, durations: "range", minDuration: 2, maxDuration: 15, resolutions: ["720P", "1080P"], audio: "automatic" },
  "wan2.7-i2v-2026-04-25": { protocol: "media", promptLimit: 5000, durations: "range", minDuration: 2, maxDuration: 15, resolutions: ["720P", "1080P"], audio: "automatic" },
  "wan2.6-i2v": { protocol: "legacy", promptLimit: 1500, durations: "range", minDuration: 2, maxDuration: 15, resolutions: ["720P", "1080P"], audio: "automatic" },
  "wan2.5-i2v-preview": { protocol: "legacy", promptLimit: 1500, durations: [5, 10], resolutions: ["480P", "720P", "1080P"], audio: "automatic" },
  "wan2.2-i2v-plus": { protocol: "legacy", promptLimit: 800, durations: [5], resolutions: ["480P", "1080P"], audio: "none" },
  "wan2.2-i2v-flash": { protocol: "legacy", promptLimit: 800, durations: [5], resolutions: ["480P", "720P", "1080P"], audio: "none" },
  "wanx2.1-i2v-plus": { protocol: "legacy", promptLimit: 800, durations: [5], resolutions: ["720P"], audio: "none" },
  "wanx2.1-i2v-turbo": { protocol: "legacy", promptLimit: 800, durations: [3, 4, 5], resolutions: ["480P", "720P"], audio: "none" },
});

const POLL_INTERVAL_MS = 15000;
const MAX_WAIT_MS = 5 * 60 * 1000 + 30 * 1000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function canonicalModel(model) {
  return MODEL_ALIASES[model] || model;
}

function getAlibabaVideoModelChain(env = process.env) {
  const configuredPrimary = canonicalModel(env.ALIBABA_VIDEO_MODEL || DEFAULT_MODEL_CHAIN[0].trim());
  const configuredChain = (env.VIDEO_ALIBABA_MODEL_CHAIN || DEFAULT_MODEL_CHAIN.join(","))
    .split(",")
    .map((model) => canonicalModel(model.trim()))
    .filter((model) => MODEL_CAPABILITIES[model]);
  const chain = [configuredPrimary, ...configuredChain.filter((model) => model !== configuredPrimary)];
  return [...new Set(chain)].filter((model) => MODEL_CAPABILITIES[model]);
}

function isFallbackEnabled(env = process.env) {
  return env.VIDEO_ALIBABA_FALLBACK_ENABLED !== "false";
}

function getApiKey() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY is not configured on the server.");
  return apiKey;
}

function normalizeDuration(duration) {
  const value = Number(duration);
  return Number.isFinite(value) ? Math.min(15, Math.max(2, Math.round(value))) : 5;
}

function chooseClosest(value, choices) {
  return choices.reduce((closest, choice) =>
    Math.abs(choice - value) < Math.abs(closest - value) ? choice : closest,
  choices[0]);
}

function mapDuration(capabilities, duration) {
  const value = normalizeDuration(duration);
  if (capabilities.durations === "range") {
    return Math.min(capabilities.maxDuration, Math.max(capabilities.minDuration, value));
  }
  return chooseClosest(value, capabilities.durations);
}

function mapResolution(capabilities, resolution) {
  const requested = resolution === "1080P" ? 1080 : 720;
  const tiers = capabilities.resolutions.map((candidate) => ({ candidate, value: Number.parseInt(candidate, 10) }));
  return tiers.reduce((closest, tier) => {
    const currentDistance = Math.abs(closest.value - requested);
    const tierDistance = Math.abs(tier.value - requested);
    return tierDistance < currentDistance || (tierDistance === currentDistance && tier.value > closest.value) ? tier : closest;
  }).candidate;
}

function getDataUriByteLength(imageData) {
  const base64 = imageData.split(",", 2)[1] || "";
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}

function getModelCompatibility(model, request) {
  const capabilities = MODEL_CAPABILITIES[model];
  if (!capabilities) return { compatible: false, reason: "model_not_configured" };
  if (!request.prompt || typeof request.prompt !== "string") return { compatible: false, reason: "prompt_required" };
  if (!request.imageData || typeof request.imageData !== "string") return { compatible: false, reason: "image_required" };
  if (getDataUriByteLength(request.imageData) > (capabilities.protocol === "legacy" && model.startsWith("wan2.2") || model.startsWith("wanx2.1") ? 10 * 1024 * 1024 : MAX_IMAGE_BYTES)) {
    return { compatible: false, reason: "image_exceeds_model_limit" };
  }
  if (request.audio && capabilities.audio === "none") return { compatible: false, reason: "model_does_not_support_audio" };
  if (!request.audio && capabilities.audio === "automatic") return { compatible: false, reason: "model_cannot_disable_audio" };
  return { compatible: true, capabilities };
}

function buildModelRequest(model, request) {
  const capabilities = MODEL_CAPABILITIES[model];
  const input = capabilities.protocol === "media"
    ? { prompt: request.prompt, media: [{ type: "first_frame", url: request.imageData }] }
    : { prompt: request.prompt, img_url: request.imageData };
  const parameters = {
    resolution: mapResolution(capabilities, request.resolution),
    duration: mapDuration(capabilities, request.duration),
    prompt_extend: request.promptExtend,
    watermark: false,
  };
  if (capabilities.audio === "toggle") parameters.audio = Boolean(request.audio);
  return { model, input, parameters };
}

function classifyAlibabaVideoError(error) {
  const code = String(error?.providerCode || error?.code || "").toLowerCase();
  const message = String(error?.providerMessage || error?.message || "").toLowerCase();
  const combined = `${code} ${message}`;

  if (/allocationquota\.freetieronly|free.?tier.{0,30}(quota|exhaust)|(?:quota|free.?tier).{0,30}(exhaust|deplet|insufficient)|(?:exhaust|deplet).{0,30}(?:free.?tier|quota)|resource.?exhausted|insufficient.?balance/.test(combined)) {
    return "QUOTA_EXHAUSTED";
  }
  if (error?.providerStatus === 429 || /throttling\.(ratequota|limitrequests)|rate.?limit|too many requests/.test(combined)) {
    return "RATE_LIMITED";
  }
  if ((Number(error?.providerStatus) >= 500 && Number(error?.providerStatus) <= 599) || /service.?unavailable|modelserviceunavailable|model.?unavailable|modelnotfound|modelnotavailable|model_not_found|model_not_available|model.{0,50}(?:not found|not supported|does not exist|unsupported)|(?:not found|not supported|unsupported).{0,50}model/.test(combined)) {
    return "PROVIDER_UNAVAILABLE";
  }
  return "NON_RETRYABLE";
}

function isRetryableClassification(classification) {
  return ["QUOTA_EXHAUSTED", "RATE_LIMITED", "PROVIDER_UNAVAILABLE"].includes(classification);
}

function safeProviderError(data, status, model, apiKey) {
  const rawMessage = data?.message || data?.output?.message || data?.error?.message || data?.output?.error?.message || (typeof data?.error === "string" ? data.error : null) || `Alibaba video generation request failed (HTTP ${status}).`;
  const providerMessage = String(rawMessage).replace(apiKey || "\u0000", "[redacted]").slice(0, 1000);
  const error = new Error(providerMessage);
  error.provider = "alibaba";
  error.model = model;
  error.providerStatus = status;
  error.providerCode = data?.code || data?.output?.code || data?.error?.code || data?.output?.error?.code || null;
  error.requestId = data?.request_id || data?.requestId || data?.error?.request_id || data?.error?.requestId || data?.output?.request_id || data?.output?.error?.request_id || null;
  error.providerMessage = providerMessage;
  error.classification = classifyAlibabaVideoError(error);
  error.quotaExhausted = error.classification === "QUOTA_EXHAUSTED";
  error.status = status >= 400 ? status : error.quotaExhausted ? 503 : error.classification === "RATE_LIMITED" ? 429 : 502;
  return error;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text.slice(0, 1000) }; }
}

async function imageUrlToDataUri(imageUrl) {
  if (imageUrl.startsWith("data:image/")) {
    const match = imageUrl.match(/^data:image\/(?:jpeg|jpg|png|bmp|webp);base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) throw new Error("Storyboard image data must be a valid JPEG, PNG, BMP, or WEBP base64 image.");
    const bytes = getDataUriByteLength(imageUrl);
    if (!bytes || bytes > MAX_IMAGE_BYTES) throw new Error("Storyboard image must be non-empty and no larger than 20 MB.");
    return imageUrl;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Storyboard image could not be downloaded. HTTP ${response.status}.`);
  const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  const supportedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/bmp", "image/webp"]);
  if (!supportedTypes.has(contentType)) throw new Error("Storyboard image must be a JPEG, PNG, BMP, or WEBP file.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("Storyboard image download returned an empty file.");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Storyboard image is larger than Wan's 20 MB input limit.");
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createVideoTask({ model, body, apiKey }) {
  const response = await fetch(`${API_BASE_URL}/services/aigc/video-generation/video-synthesis`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(response);
  if (!response.ok) throw safeProviderError(data, response.status, model, apiKey);
  const taskId = data?.output?.task_id;
  if (!taskId) {
    const error = new Error("Alibaba accepted the request but returned no task ID.");
    error.provider = "alibaba";
    error.model = model;
    error.providerStatus = response.status;
    error.providerCode = data?.code || null;
    error.requestId = data?.request_id || null;
    error.providerMessage = error.message;
    throw error;
  }
  return { taskId, requestId: data?.request_id || null };
}

async function getVideoTask(taskId, model, apiKey) {
  const response = await fetch(`${API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await parseResponse(response);
  if (!response.ok) throw safeProviderError(data, response.status, model, apiKey);
  const output = data?.output || {};
  if (["FAILED", "CANCELED"].includes(output.task_status)) {
    throw safeProviderError({
      code: output.code || data?.code,
      message: output.message || data?.message || `Alibaba video task ${output.task_status.toLowerCase()}.`,
      request_id: data?.request_id,
    }, 200, model, apiKey);
  }
  if (output.task_status === "UNKNOWN") {
    const error = new Error("Alibaba video task became unavailable.");
    error.provider = "alibaba";
    error.model = model;
    error.providerStatus = 404;
    error.providerCode = "TaskUnavailable";
    error.requestId = data?.request_id || null;
    error.providerMessage = error.message;
    throw error;
  }
  return data;
}

async function waitForVideo(taskId, model, apiKey, generationId) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < MAX_WAIT_MS) {
    const data = await getVideoTask(taskId, model, apiKey);
    const output = data?.output || {};
    if (output.task_status === "SUCCEEDED") {
      if (!output.video_url) throw new Error("Alibaba video generation succeeded but no video URL was returned.");
      return {
        url: output.video_url,
        taskId,
        requestId: data?.request_id || null,
        duration: output?.usage?.output_video_duration || output?.usage?.duration || null,
        resolution: output?.usage?.SR ? `${output.usage.SR}P` : null,
      };
    }
    await sleep(POLL_INTERVAL_MS);
  }
  const error = new Error("Alibaba video generation timed out after 5 minutes.");
  error.provider = "alibaba";
  error.model = model;
  error.providerStatus = 504;
  error.providerCode = "TaskTimeout";
  error.providerMessage = error.message;
  error.generationId = generationId;
  throw error;
}

function logAttempt({ generationId, model, classification, error, requestId, startedAt, outcome }) {
  if (process.env.NODE_ENV !== "development" && outcome === "succeeded") return;
  console.info("Alibaba video model attempt", {
    generationId: generationId || null,
    provider: "alibaba",
    model,
    classification: classification || null,
    status: error?.providerStatus || null,
    providerCode: error?.providerCode || null,
    providerMessage: error?.providerMessage || error?.message || null,
    requestId: error?.requestId || requestId || null,
    elapsedMs: Date.now() - startedAt,
    outcome,
  });
}

async function reportProgress(onProgress, status) {
  if (!onProgress) return;
  try { await onProgress(status); } catch { /* Status reporting must not interrupt generation. */ }
}

function logPreflight(request, models, imageUrl) {
  if (process.env.NODE_ENV !== "development") return;
  const imageMime = request.imageData.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)?.[1]?.toLowerCase() || null;
  console.info("VIDEO PREFLIGHT", {
    requested: {
      duration: request.duration,
      resolution: request.resolution,
      audioMode: request.audio ? "ai_audio" : "no_audio",
      hasReferenceImage: Boolean(imageUrl),
      referenceImage: { mimeType: imageMime, hasUrlOrData: Boolean(imageUrl), byteLength: getDataUriByteLength(request.imageData) },
      promptCharacters: [...request.prompt].length,
    },
  });
  for (const model of models) {
    const decision = getModelCompatibility(model, request);
    const capabilities = MODEL_CAPABILITIES[model];
    console.info("VIDEO PREFLIGHT model decision", {
      model,
      compatible: decision.compatible,
      reason: decision.reason || "compatible",
      mappedDuration: capabilities ? mapDuration(capabilities, request.duration) : null,
      mappedResolution: capabilities ? mapResolution(capabilities, request.resolution) : null,
    });
  }
}

async function generateVideo({
  imageUrl,
  prompt,
  duration = 5,
  resolution,
  audio = true,
  requestedModel,
  onStarted,
  onProgress,
  generationId,
}) {
  if (process.env.ALIBABA_VIDEO_ENABLED === "false") {
    const error = new Error("Video generation is disabled by server configuration.");
    error.status = 503;
    throw error;
  }
  if (process.env.VIDEO_PRIMARY_PROVIDER && process.env.VIDEO_PRIMARY_PROVIDER !== "alibaba") {
    const error = new Error("The configured primary video provider is not implemented.");
    error.status = 503;
    throw error;
  }
  if (!imageUrl || typeof imageUrl !== "string") throw new Error("A valid storyboard image URL is required.");
  if (!prompt || typeof prompt !== "string") throw new Error("A valid video prompt is required.");

  const apiKey = getApiKey();
  const imageData = await imageUrlToDataUri(imageUrl);
  const promptExtend = process.env.ALIBABA_PROMPT_EXTEND === "true";
  const requestedAudio = Boolean(audio);
  const request = {
    imageData,
    prompt: prompt.trim(),
    duration: normalizeDuration(duration),
    resolution: resolution === "1080P" ? "1080P" : "720P",
    audio: requestedAudio,
    promptExtend,
  };
  const configuredChain = getAlibabaVideoModelChain();
  if (requestedModel && !configuredChain.includes(canonicalModel(requestedModel))) {
    const error = new Error("The selected video model is not in the configured Alibaba model chain.");
    error.status = 400;
    throw error;
  }
  const orderedChain = requestedModel
    ? [canonicalModel(requestedModel), ...configuredChain.filter((model) => model !== canonicalModel(requestedModel))]
    : configuredChain;
  const models = isFallbackEnabled() ? orderedChain : orderedChain.slice(0, 1);
  logPreflight(request, models, imageUrl);
  const attemptedModels = [];
  const skippedModels = [];
  let lastRetryableError = null;

  for (const [modelIndex, model] of models.entries()) {
    const startedAt = Date.now();
    const compatibility = getModelCompatibility(model, request);
    if (!compatibility.compatible) {
      skippedModels.push({ model, reason: compatibility.reason });
      logAttempt({ generationId, model, classification: compatibility.reason, startedAt, outcome: "skipped" });
      continue;
    }

    attemptedModels.push(model);
    await reportProgress(onProgress, {
      state: attemptedModels.length > 1 || model !== orderedChain[0] ? "backup" : "primary",
      model,
    });
    const body = buildModelRequest(model, request);
    let task;
    try {
      task = await createVideoTask({ model, body, apiKey });
      if (onStarted) await onStarted({ taskId: task.taskId, model });
      const result = await waitForVideo(task.taskId, model, apiKey, generationId);
      const audioGenerated = requestedAudio && compatibility.capabilities.audio !== "none";
      logAttempt({ generationId, model, requestId: result.requestId || task.requestId, startedAt, outcome: "succeeded" });
      return {
        provider: "alibaba",
        model,
        url: result.url,
        type: "video",
        duration: result.duration || body.parameters.duration,
        requestedDuration: request.duration,
        requestedResolution: request.resolution,
        actualResolution: result.resolution || body.parameters.resolution,
        taskId: result.taskId,
        requestId: result.requestId || task.requestId,
        createdAt: new Date().toISOString(),
        audioRequested: requestedAudio,
        audioGenerated,
        attemptedModels,
        skippedModels,
        selectedModel: model,
        fallbackUsed: orderedChain[0] !== model,
      };
    } catch (error) {
      if (!error.provider) throw error;
      const classification = classifyAlibabaVideoError(error);
      logAttempt({ generationId, model, classification, error, startedAt, outcome: "failed" });
      if (!isRetryableClassification(classification)) throw error;
      lastRetryableError = error;
      const nextModel = models.slice(modelIndex + 1).find((candidate) => getModelCompatibility(candidate, request).compatible) || null;
      if (nextModel) await reportProgress(onProgress, { state: "switching", model, nextModel });
    }
  }

  if (lastRetryableError) {
    const summary = new Error("All compatible Alibaba video models are currently unavailable. Please try again later.");
    summary.provider = "alibaba";
    summary.model = lastRetryableError.model;
    summary.providerStatus = lastRetryableError.providerStatus;
    summary.classification = classifyAlibabaVideoError(lastRetryableError);
    summary.status = summary.classification === "RATE_LIMITED" ? 429 : 503;
    summary.providerCode = lastRetryableError.providerCode;
    summary.requestId = lastRetryableError.requestId;
    summary.providerMessage = lastRetryableError.providerMessage || lastRetryableError.message;
    summary.quotaExhausted = classifyAlibabaVideoError(lastRetryableError) === "QUOTA_EXHAUSTED";
    summary.attemptedModels = attemptedModels;
    summary.skippedModels = skippedModels;
    throw summary;
  }

  const noCompatibleModel = new Error("No configured Alibaba video model supports this prompt, image, duration, resolution, and audio selection.");
  noCompatibleModel.status = 422;
  noCompatibleModel.attemptedModels = attemptedModels;
  noCompatibleModel.skippedModels = skippedModels;
  throw noCompatibleModel;
}

module.exports = {
  generateVideo,
  getAlibabaVideoModelChain,
  buildModelRequest,
  getModelCompatibility,
  classifyAlibabaVideoError,
  isFallbackEnabled,
  MODEL_CAPABILITIES,
  DEFAULT_MODEL_CHAIN,
};
