const { test } = require("node:test");
const assert = require("node:assert/strict");

const videoGenerationService = require("../services/Generation/videoGeneration.service");
const videoService = require("../services/Video/video.service");
const videoStorageService = require("../services/Storage/videoStorage.service");
const creditsService = require("../services/Credits/credits.service");
const videoGenerationStatusService = require("../services/Generation/videoGenerationStatus.service");
const controller = require("./VideoGenerationController");

function setup(t, generator) {
  const originals = {
    generate: videoGenerationService.generate,
    createVideo: videoService.createVideo,
    saveFromUrl: videoStorageService.saveFromUrl,
    preflight: creditsService.preflight,
    charge: creditsService.charge,
    refund: creditsService.refund,
  };
  t.after(() => Object.assign(videoGenerationService, { generate: originals.generate }));
  t.after(() => Object.assign(videoService, { createVideo: originals.createVideo }));
  t.after(() => Object.assign(videoStorageService, { saveFromUrl: originals.saveFromUrl }));
  t.after(() => Object.assign(creditsService, { preflight: originals.preflight, charge: originals.charge, refund: originals.refund }));

  const calls = { preflight: 0, charge: 0, refund: 0 };
  creditsService.preflight = async () => { calls.preflight += 1; };
  creditsService.charge = async () => { calls.charge += 1; };
  creditsService.refund = async () => { calls.refund += 1; };
  videoStorageService.saveFromUrl = async () => ({ path: "/uploads/video.mp4" });
  videoService.createVideo = async (video) => ({ id: "video-1", ...video });
  videoGenerationService.generate = generator;
  return calls;
}

function request() {
  return {
    user: { id: "user-1" },
    body: { imageUrl: "data:image/png;base64,AQ==", prompt: "Cinematic scene", duration: 5, quality: "1080P", audio: true },
    protocol: "http",
    get: (name) => name === "Idempotency-Key" ? "generation-request-1" : "localhost:5000",
  };
}

function responseCapture() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("controller charges once across several model task starts and returns the actual model metadata", async (t) => {
  const calls = setup(t, async ({ onStarted }) => {
    await onStarted({ taskId: "task-primary", model: "wan2.6-i2v-flash" });
    await onStarted({ taskId: "task-backup", model: "wan2.7-i2v" });
    return {
      provider: "alibaba",
      model: "wan2.7-i2v",
      selectedModel: "wan2.7-i2v",
      fallbackUsed: true,
      attemptedModels: ["wan2.6-i2v-flash", "wan2.7-i2v"],
      skippedModels: [],
      audioRequested: true,
      audioGenerated: true,
      url: "https://provider.example/result.mp4",
      duration: 5,
      taskId: "task-backup",
    };
  });
  const res = responseCapture();
  await controller.generate(request(), res);
  assert.equal(calls.preflight, 1);
  assert.equal(calls.charge, 1);
  assert.equal(calls.refund, 0);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.model, "wan2.7-i2v");
  assert.equal(res.body.data.fallbackUsed, true);
  assert.equal(res.body.data.audioGenerated, true);
});

test("controller refunds one original charge once if every fallback attempt fails", async (t) => {
  const calls = setup(t, async ({ onStarted }) => {
    await onStarted({ taskId: "task-primary", model: "wan2.6-i2v-flash" });
    await onStarted({ taskId: "task-backup", model: "wan2.7-i2v" });
    const error = new Error("All compatible Alibaba video models are currently unavailable.");
    error.provider = "alibaba";
    error.providerStatus = 503;
    error.attemptedModels = ["wan2.6-i2v-flash", "wan2.7-i2v"];
    throw error;
  });
  const res = responseCapture();
  await controller.generate(request(), res);
  assert.equal(calls.preflight, 1);
  assert.equal(calls.charge, 1);
  assert.equal(calls.refund, 1);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.message, /All compatible Alibaba video models/);
});

test("controller does not mark an asset complete and refunds credits when durable video storage fails", async (t) => {
  const calls = setup(t, async ({ onStarted }) => {
    await onStarted({ taskId: "task-storage-failure", model: "wan2.7-r2v" });
    return { provider: "alibaba", model: "wan2.7-r2v", url: "https://provider.example/video.mp4", duration: 5 };
  });
  videoStorageService.saveFromUrl = async () => { throw new Error("persistent disk unavailable"); };
  const res = responseCapture();
  await controller.generate(request(), res);
  assert.equal(calls.charge, 1);
  assert.equal(calls.refund, 1);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
});

test("generation progress is visible only to the authenticated request owner", () => {
  const requestId = "private-progress-request";
  videoGenerationStatusService.update("user-1", requestId, { state: "switching", model: "wan2.6-i2v-flash", nextModel: "wan2.7-i2v" });
  const ownerResponse = responseCapture();
  controller.getStatus({ user: { id: "user-1" }, params: { requestId } }, ownerResponse);
  assert.equal(ownerResponse.statusCode, 200);
  assert.equal(ownerResponse.body.data.state, "switching");

  const otherResponse = responseCapture();
  controller.getStatus({ user: { id: "user-2" }, params: { requestId } }, otherResponse);
  assert.equal(otherResponse.statusCode, 404);
});

