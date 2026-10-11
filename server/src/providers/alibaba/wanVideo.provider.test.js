const { test } = require("node:test");
const assert = require("node:assert/strict");

const provider = require("./wanVideo.provider");

const IMAGE = "data:image/png;base64,AQ==";
const ORIGINAL_ENV = {};
const TEST_ENV_KEYS = [
  "DASHSCOPE_API_KEY",
  "VIDEO_ALIBABA_MODEL_CHAIN",
  "VIDEO_ALIBABA_FALLBACK_ENABLED",
  "ALIBABA_VIDEO_MODEL",
  "ALIBABA_VIDEO_ENABLED",
  "ALIBABA_PROMPT_EXTEND",
];
let originalFetch;

function setTestEnv(values) {
  for (const key of TEST_ENV_KEYS) {
    if (!(key in ORIGINAL_ENV)) ORIGINAL_ENV[key] = process.env[key];
    if (Object.hasOwn(values, key)) process.env[key] = values[key];
    else delete process.env[key];
  }
  process.env.DASHSCOPE_API_KEY = "test-key-never-logged";
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data),
  };
}

function installFakeProvider(outcomes = {}) {
  const calls = [];
  const taskModels = new Map();
  let taskNumber = 0;
  global.fetch = async (url, options = {}) => {
    if (String(url).includes("video-synthesis")) {
      const body = JSON.parse(options.body);
      calls.push({ url, body });
      const outcome = outcomes[body.model];
      if (outcome?.createError) return response(outcome.createError.status, outcome.createError.data);
      const taskId = `task-${++taskNumber}`;
      taskModels.set(taskId, { model: body.model, outcome });
      return response(200, { request_id: `submit-${taskId}`, output: { task_id: taskId } });
    }
    const taskId = String(url).split("/").pop();
    const task = taskModels.get(taskId);
    if (task?.outcome?.taskError) {
      return response(200, { request_id: `poll-${taskId}`, output: { task_status: "FAILED", ...task.outcome.taskError } });
    }
    return response(200, {
      request_id: `poll-${taskId}`,
      output: { task_status: "SUCCEEDED", video_url: `https://video.example/${task?.model}.mp4`, usage: { output_video_duration: 5 } },
    });
  };
  return calls;
}

function setup(t, env, outcomes) {
  originalFetch = global.fetch;
  setTestEnv(env);
  const calls = installFakeProvider(outcomes);
  t.after(() => {
    if (originalFetch) global.fetch = originalFetch;
    originalFetch = undefined;
    for (const key of TEST_ENV_KEYS) {
      if (ORIGINAL_ENV[key] === undefined) delete process.env[key];
      else process.env[key] = ORIGINAL_ENV[key];
      delete ORIGINAL_ENV[key];
    }
  });
  return calls;
}

const baseRequest = { imageUrl: IMAGE, prompt: "A cinematic scene", duration: 8, resolution: "1080P", audio: true };

test("primary Wan 2.6 Flash succeeds without trying a fallback", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v" });
  const started = [];
  const result = await provider.generateVideo({ ...baseRequest, onStarted: (info) => started.push(info) });
  assert.equal(calls.length, 1);
  assert.equal(result.model, "wan2.6-i2v-flash");
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.audioRequested, true);
  assert.equal(result.audioGenerated, true);
  assert.equal(started.length, 1);
});

test("a manually selected configured Wan model starts first and keeps fallback controls", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v" });
  const result = await provider.generateVideo({ ...baseRequest, requestedModel: "wan2.7-i2v" });
  assert.deepEqual(calls.map(({ body }) => body.model), ["wan2.7-i2v"]);
  assert.equal(result.model, "wan2.7-i2v");
  assert.equal(result.fallbackUsed, false);
});

test("manual model selection rejects models outside the configured provider chain", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash" });
  await assert.rejects(provider.generateVideo({ ...baseRequest, requestedModel: "wan2.7-i2v" }), /not in the configured Alibaba model chain/);
  assert.equal(calls.length, 0);
});

test("confirmed free quota exhaustion advances to Wan 2.7 with its media protocol", async (t) => {
  const calls = setup(t, {
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v",
  }, {
    "wan2.6-i2v-flash": { createError: { status: 403, data: { code: "AllocationQuota.FreeTierOnly", message: "Free quota exhausted" } } },
  });
  const result = await provider.generateVideo(baseRequest);
  assert.deepEqual(calls.map(({ body }) => body.model), ["wan2.6-i2v-flash", "wan2.7-i2v"]);
  assert.equal(calls[1].body.input.media[0].type, "first_frame");
  assert.equal(calls[1].body.input.media[0].url, IMAGE);
  assert.equal(calls[1].body.input.img_url, undefined);
  assert.equal(result.model, "wan2.7-i2v");
  assert.equal(result.fallbackUsed, true);
});

test("an unavailable Wan 2.7 model advances once to the dated Wan 2.7 model", async (t) => {
  const calls = setup(t, {
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v,wan2.7-i2v-2026-04-25",
  }, {
    "wan2.6-i2v-flash": { createError: { status: 403, data: { code: "AllocationQuota.FreeTierOnly", message: "Free quota exhausted" } } },
    "wan2.7-i2v": { createError: { status: 503, data: { code: "ModelServiceUnavailable", message: "Model service unavailable" } } },
  });
  const result = await provider.generateVideo(baseRequest);
  assert.deepEqual(calls.map(({ body }) => body.model), ["wan2.6-i2v-flash", "wan2.7-i2v", "wan2.7-i2v-2026-04-25"]);
  assert.equal(result.model, "wan2.7-i2v-2026-04-25");
  assert.equal(result.attemptedModels.length, 3);
});

test("a task quota failure followed by a fallback still invokes the charge hook once when guarded", async (t) => {
  const calls = setup(t, {
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v",
  }, {
    "wan2.6-i2v-flash": { taskError: { code: "AllocationQuota.FreeTierOnly", message: "Free quota has been exhausted" } },
  });
  let charged = false;
  let chargeCount = 0;
  const result = await provider.generateVideo({
    ...baseRequest,
    onStarted: async () => {
      if (charged) return;
      charged = true;
      chargeCount += 1;
    },
  });
  assert.equal(calls.length, 2);
  assert.equal(chargeCount, 1);
  assert.equal(result.model, "wan2.7-i2v");
});

test("a generic 403 is non-retryable and does not exhaust the model chain", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v" }, {
    "wan2.6-i2v-flash": { createError: { status: 403, data: { code: "InvalidApiKey", message: "Invalid API key" } } },
  });
  await assert.rejects(provider.generateVideo(baseRequest), (error) => {
    assert.equal(error.providerCode, "InvalidApiKey");
    assert.equal(provider.classifyAlibabaVideoError(error), "NON_RETRYABLE");
    return true;
  });
  assert.equal(calls.length, 1);
});

test("fallback can be explicitly disabled without trying a second configured model", async (t) => {
  const calls = setup(t, {
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v",
    VIDEO_ALIBABA_FALLBACK_ENABLED: "false",
  }, {
    "wan2.6-i2v-flash": { createError: { status: 429, data: { code: "Throttling.RateQuota", message: "Rate limit" } } },
  });
  await assert.rejects(provider.generateVideo(baseRequest), /All compatible Alibaba video models/);
  assert.equal(calls.length, 1);
});

test("a configured model unavailable in the active Alibaba region advances to the next model", async (t) => {
  const calls = setup(t, {
    ALIBABA_VIDEO_MODEL: "wan2.7-i2v",
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.7-i2v,wan2.7-i2v-2026-04-25",
  }, {
    "wan2.7-i2v": { createError: { status: 400, data: { code: "InvalidParameter", message: "Model is not supported in this region" } } },
  });
  const result = await provider.generateVideo(baseRequest);
  assert.deepEqual(calls.map(({ body }) => body.model), ["wan2.7-i2v", "wan2.7-i2v-2026-04-25"]);
  assert.equal(result.model, "wan2.7-i2v-2026-04-25");
});

test("invalid input fails before any provider model is attempted", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v" });
  await assert.rejects(provider.generateVideo({ imageUrl: IMAGE, prompt: "" }), /valid video prompt/);
  assert.equal(calls.length, 0);
});

test("Wan 2.7 and legacy Wan I2V payloads retain their distinct request formats and controls", () => {
  const common = { imageData: IMAGE, prompt: "Same Ultra prompt", duration: 12, resolution: "1080P", audio: true, promptExtend: true };
  const flash = provider.buildModelRequest("wan2.6-i2v-flash", { ...common, audio: false });
  const wan27 = provider.buildModelRequest("wan2.7-i2v", common);
  const wan26 = provider.buildModelRequest("wan2.6-i2v", common);
  assert.deepEqual(flash, {
    model: "wan2.6-i2v-flash",
    input: { prompt: common.prompt, img_url: IMAGE },
    parameters: { resolution: "1080P", duration: 12, prompt_extend: true, watermark: false, audio: false },
  });
  assert.deepEqual(wan27, {
    model: "wan2.7-i2v",
    input: { prompt: common.prompt, media: [{ type: "first_frame", url: IMAGE }] },
    parameters: { resolution: "1080P", duration: 12, prompt_extend: true, watermark: false },
  });
  assert.deepEqual(wan26.input, { prompt: common.prompt, img_url: IMAGE });
  assert.equal(wan26.parameters.audio, undefined);
});

test("unsupported duration and resolution retain the nearest quality tier without avoidable downgrades", () => {
  const plus = provider.buildModelRequest("wan2.2-i2v-plus", {
    imageData: IMAGE, prompt: "Short prompt", duration: 12, resolution: "720P", audio: true, promptExtend: false,
  });
  assert.equal(plus.parameters.duration, 5);
  assert.equal(plus.parameters.resolution, "480P");
  assert.equal(plus.parameters.audio, undefined);
  const plus1080 = provider.buildModelRequest("wan2.2-i2v-plus", {
    imageData: IMAGE, prompt: "Short prompt", duration: 5, resolution: "1080P", audio: false, promptExtend: false,
  });
  assert.equal(plus1080.parameters.resolution, "1080P");
  const wan21 = provider.buildModelRequest("wanx2.1-i2v-plus", {
    imageData: IMAGE, prompt: "Short prompt", duration: 10, resolution: "1080P", audio: false, promptExtend: false,
  });
  assert.equal(wan21.parameters.resolution, "720P");
  assert.equal(wan21.parameters.duration, 5);
});

test("No Audio with a valid storyboard image, prompt, 5 seconds and 720p reaches a compatible model", async (t) => {
  const calls = setup(t, {
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v,wan2.2-i2v-plus",
  }, {
    "wan2.6-i2v-flash": { createError: { status: 403, data: { code: "AllocationQuota.FreeTierOnly", message: "Free quota exhausted" } } },
  });
  const result = await provider.generateVideo({ ...baseRequest, duration: 5, resolution: "720P", audio: false });
  assert.deepEqual(calls.map(({ body }) => body.model), ["wan2.6-i2v-flash", "wan2.2-i2v-plus"]);
  assert.equal(result.audioRequested, false);
  assert.equal(result.audioGenerated, false);
  assert.equal(calls[0].body.parameters.duration, 5);
  assert.equal(calls[0].body.parameters.resolution, "720P");
  assert.equal(calls[1].body.input.img_url, IMAGE);
  assert.deepEqual(result.skippedModels, [{ model: "wan2.7-i2v", reason: "model_cannot_disable_audio" }]);
});

test("AI Audio skips silent-only models and reaches Wan 2.7 after primary quota exhaustion", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v,wan2.2-i2v-plus" }, {
    "wan2.6-i2v-flash": { createError: { status: 403, data: { code: "AllocationQuota.FreeTierOnly", message: "Free quota exhausted" } } },
  });
  const result = await provider.generateVideo({ ...baseRequest, audio: true });
  assert.deepEqual(calls.map(({ body }) => body.model), ["wan2.6-i2v-flash", "wan2.7-i2v"]);
  assert.equal(result.audioGenerated, true);
  assert.equal(provider.getModelCompatibility("wan2.2-i2v-plus", { imageData: IMAGE, prompt: "A scene", audio: true }).compatible, false);
});

test("long storyboard prompts are passed unchanged to preflight-compatible models", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash" });
  const prompt = "cinematic visual direction ".repeat(100);
  const result = await provider.generateVideo({ ...baseRequest, prompt, audio: false, duration: 5, resolution: "720P" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.input.prompt, prompt.trim());
  assert.equal(result.actualResolution, "720P");
  assert.equal(result.requestedDuration, 5);
});

test("each fallback receives the same prompt and storyboard image while model settings stay model-specific", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v" }, {
    "wan2.6-i2v-flash": { createError: { status: 429, data: { code: "Throttling.RateQuota", message: "Rate limit" } } },
  });
  const prompt = "ULTRA CINEMATIC SCENE\nACTION: the referenced character runs toward the rescue ship.\nDIALOGUE: spoken line is preserved as scene context.\nNo visible text, captions, subtitles, labels, or title cards.";
  const result = await provider.generateVideo({ ...baseRequest, prompt, generationId: "diagnostic-request-id" });
  assert.equal(result.model, "wan2.7-i2v");
  assert.equal(calls[0].body.input.prompt, prompt);
  assert.equal(calls[1].body.input.prompt, prompt);
  assert.equal(calls[0].body.input.img_url, IMAGE);
  assert.equal(calls[1].body.input.media[0].url, IMAGE);
  assert.equal(calls[0].body.parameters.duration, calls[1].body.parameters.duration);
  assert.equal(calls[0].body.parameters.resolution, calls[1].body.parameters.resolution);
  assert.equal(calls[0].body.parameters.prompt_extend, calls[1].body.parameters.prompt_extend);
  assert.equal(calls[0].body.parameters.watermark, false);
  assert.equal(calls[1].body.parameters.watermark, false);
});

test("all retryable model failures return a clean aggregate with diagnostics and attempted model list", async (t) => {
  const calls = setup(t, { VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.7-i2v" }, {
    "wan2.6-i2v-flash": { createError: { status: 403, data: { code: "AllocationQuota.FreeTierOnly", message: "Free quota exhausted", request_id: "request-primary" } } },
    "wan2.7-i2v": { createError: { status: 503, data: { code: "ModelServiceUnavailable", message: "Service unavailable", request_id: "request-backup" } } },
  });
  await assert.rejects(provider.generateVideo(baseRequest), (error) => {
    assert.equal(error.message, "All compatible Alibaba video models are currently unavailable. Please try again later.");
    assert.equal(error.status, 503);
    assert.equal(error.attemptedModels.length, 2);
    assert.equal(error.requestId, "request-backup");
    return true;
  });
  assert.equal(calls.length, 2);
});

test("configured Wan 2.1 aliases map to Alibaba's documented wanx model IDs", () => {
  assert.deepEqual(provider.getAlibabaVideoModelChain({
    ALIBABA_VIDEO_MODEL: "wan2.1-i2v-plus",
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.1-i2v-plus,wan2.1-i2v-turbo",
  }), ["wanx2.1-i2v-plus", "wanx2.1-i2v-turbo"]);
});

test("default chain contains only the requested I2V models and can be disabled safely", () => {
  assert.deepEqual(provider.getAlibabaVideoModelChain({}), [
    "wan2.6-i2v-flash",
    "wan2.7-i2v",
    "wan2.7-i2v-2026-04-25",
    "wan2.6-i2v",
    "wan2.5-i2v-preview",
    "wan2.2-i2v-plus",
    "wan2.2-i2v-flash",
    "wanx2.1-i2v-plus",
    "wanx2.1-i2v-turbo",
  ]);
  assert.equal(provider.getAlibabaVideoModelChain({}).some((model) => /t2v|r2v/.test(model)), false);
  assert.equal(provider.isFallbackEnabled({ VIDEO_ALIBABA_FALLBACK_ENABLED: "false" }), false);
  assert.equal(provider.isFallbackEnabled({}), true);
});

\n