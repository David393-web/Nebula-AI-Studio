const { test } = require("node:test");
const assert = require("node:assert/strict");

const videoGenerationService = require("../services/Generation/videoGeneration.service");
const videoService = require("../services/Video/video.service");
const videoStorageService = require("../services/Storage/videoStorage.service");
const creditsService = require("../services/Credits/credits.service");
const controller = require("./VideoGenerationController");

function setup(t, generator = async ({ onStarted }) => {
  await onStarted({ taskId: "task-1", model: "wan2.6-i2v-flash" });
  return { provider: "alibaba", model: "wan2.6-i2v-flash", selectedModel: "wan2.6-i2v-flash", taskId: "task-1", requestId: "request-1", status: "PENDING", audioRequested: true, audioGenerated: true };
}) {
  const originals = {
    generate: videoGenerationService.generate,
    getTaskStatus: videoGenerationService.getTaskStatus,
    createVideo: videoService.createVideo,
    getVideo: videoService.getVideo,
    getGeneration: videoService.getGeneration,
    updateVideo: videoService.updateVideo,
    claimGenerationPoll: videoService.claimGenerationPoll,
    saveFromUrl: videoStorageService.saveFromUrl,
    isDurableConfigured: videoStorageService.isDurableConfigured,
    preflight: creditsService.preflight,
    charge: creditsService.charge,
    hasCharge: creditsService.hasCharge,
    refund: creditsService.refund,
    finalizeTask: controller.finalizeTask,
  };
  const db = new Map();
  const calls = { preflight: 0, charge: 0, refund: 0, submit: 0, poll: 0, media: 0 };
  Object.assign(videoGenerationService, {
    generate: async (args) => { calls.submit += 1; return generator(args); },
    getTaskStatus: async () => { calls.poll += 1; return { status: "RUNNING", taskId: "task-1" }; },
  });
  Object.assign(videoService, {
    createVideo: async (video) => { if (db.has(video.id)) throw Object.assign(new Error("duplicate"), { code: "P2002" }); db.set(video.id, { ...video, createdAt: new Date(), updatedAt: new Date() }); return db.get(video.id); },
    getVideo: async (id, userId) => { const video = db.get(id); if (!video || video.userId !== userId) throw Object.assign(new Error("not found"), { status: 404 }); return video; },
    getGeneration: async (id, userId) => { const video = db.get(id); return video?.userId === userId ? video : null; },
    updateVideo: async (id, userId, patch) => { const current = await videoService.getVideo(id, userId); const updated = { ...current, ...patch, metadata: patch.metadata || current.metadata, updatedAt: new Date() }; db.set(id, updated); return updated; },
    claimGenerationPoll: async (video, metadata) => { const current = db.get(video.id); if (!current || current.updatedAt !== video.updatedAt) return false; await videoService.updateVideo(video.id, video.userId, { metadata }); return true; },
  });
  Object.assign(videoStorageService, {
    isDurableConfigured: () => true,
    saveFromUrl: async () => { calls.media += 1; return { provider: "supabase", bucket: "private-media", storageKey: "users/user-1/video.mp4", localStorageKey: "temporary/video.mp4", size: 1024, mimeType: "video/mp4" }; },
  });
  Object.assign(creditsService, {
    preflight: async () => { calls.preflight += 1; },
    charge: async () => { calls.charge += 1; },
    hasCharge: async () => calls.charge > 0,
    refund: async () => { calls.refund += 1; },
  });
  t.after(() => {
    Object.assign(videoGenerationService, { generate: originals.generate, getTaskStatus: originals.getTaskStatus });
    Object.assign(videoService, { createVideo: originals.createVideo, getVideo: originals.getVideo, getGeneration: originals.getGeneration, updateVideo: originals.updateVideo, claimGenerationPoll: originals.claimGenerationPoll });
    Object.assign(videoStorageService, { saveFromUrl: originals.saveFromUrl, isDurableConfigured: originals.isDurableConfigured });
    Object.assign(creditsService, { preflight: originals.preflight, charge: originals.charge, hasCharge: originals.hasCharge, refund: originals.refund });
    controller.finalizeTask = originals.finalizeTask;
  });
  return { calls, db };
}

function request(id = "generation-1") {
  return {
    user: { id: "user-1" },
    body: { imageUrl: "https://media.example/image.png", prompt: "Cinematic scene", duration: 5, quality: "1080P", audio: true, frameMode: "first_frame" },
    protocol: "https",
    params: { requestId: id },
    get: (name) => name === "Idempotency-Key" ? id : "nebula.example",
  };
}

function responseCapture() {
  return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

function makePollDue(db, id = "generation-1") {
  const video = db.get(id);
  db.set(id, { ...video, metadata: { ...video.metadata, nextPollAt: null } });
}

test("prompt submission persists task ID and returns promptly with pending status", async (t) => {
  const { calls, db } = setup(t);
  const res = responseCapture();
  await controller.generate(request(), res);
  assert.equal(res.statusCode, 202);
  assert.deepEqual({ generationId: res.body.data.generationId, taskId: res.body.data.taskId, state: res.body.data.state }, { generationId: "generation-1", taskId: "task-1", state: "pending" });
  assert.equal(calls.submit, 1);
  assert.equal(calls.charge, 1);
  assert.equal(db.get("generation-1").metadata.state, "pending");
});

test("repeated request with the same idempotency key never submits or charges twice", async (t) => {
  const { calls } = setup(t);
  const first = responseCapture();
  await controller.generate(request(), first);
  const repeated = responseCapture();
  await controller.generate(request(), repeated);
  assert.equal(repeated.statusCode, 202);
  assert.equal(repeated.body.data.taskId, "task-1");
  assert.equal(calls.submit, 1);
  assert.equal(calls.charge, 1);
});

test("status polling handles RUNNING without holding submission open", async (t) => {
  const { db, calls } = setup(t);
  const submit = responseCapture();
  await controller.generate(request(), submit);
  makePollDue(db);
  const status = responseCapture();
  await controller.getStatus(request(), status);
  assert.equal(status.body.data.state, "running");
  assert.equal(calls.poll, 1);
  assert.equal(db.get("generation-1").metadata.taskId, "task-1");
});

test("SUCCEEDED task is persisted to Supabase and exposed through authorized video playback", async (t) => {
  const { db, calls } = setup(t);
  await controller.generate(request(), responseCapture());
  makePollDue(db);
  videoGenerationService.getTaskStatus = async () => ({ status: "SUCCEEDED", taskId: "task-1", requestId: "provider-request", result: { url: "https://provider.example/signed.mp4?secret=x", duration: 5, resolution: "1080P" } });
  controller.finalizeTask = async (video, result) => {
    assert.match(result.url, /secret=x/);
    const stored = await videoStorageService.saveFromUrl(result.url, { userId: video.userId, generationId: video.metadata.generationId });
    assert.equal(stored.provider, "supabase");
    return videoService.updateVideo(video.id, video.userId, { metadata: { ...video.metadata, state: "completed", storageProvider: stored.provider, storageBucket: stored.bucket, storageKey: stored.storageKey } });
  };
  const status = responseCapture();
  await controller.getStatus(request(), status);
  await new Promise((resolve) => setImmediate(resolve));
  const finalStatus = responseCapture();
  await controller.getStatus(request(), finalStatus);
  assert.equal(finalStatus.body.data.state, "completed");
  assert.equal(finalStatus.body.data.video.url, "https://nebula.example/api/videos/generation-1/media");
  assert.equal(JSON.stringify(finalStatus.body).includes("signed.mp4"), false);
  assert.equal(db.get("generation-1").metadata.storageProvider, "supabase");
  assert.equal(calls.media, 1);
});

test("provider FAILED task refunds exactly once and becomes terminal", async (t) => {
  const { calls, db } = setup(t);
  await controller.generate(request(), responseCapture());
  makePollDue(db);
  videoGenerationService.getTaskStatus = async () => ({ status: "FAILED", code: "ModelServiceUnavailable" });
  await controller.getStatus(request(), responseCapture());
  const status = responseCapture();
  await controller.getStatus(request(), status);
  assert.equal(status.body.data.state, "failed");
  assert.equal(calls.refund, 1);
  assert.equal(db.get("generation-1").metadata.providerMessage.includes("Credits were returned"), true);
});

test("rate limited status checks remain recoverable and do not refund or resubmit", async (t) => {
  const { calls, db } = setup(t);
  await controller.generate(request(), responseCapture());
  makePollDue(db);
  videoGenerationService.getTaskStatus = async () => { throw Object.assign(new Error("Rate limit"), { providerStatus: 429, providerCode: "Throttling.RateQuota" }); };
  const status = responseCapture();
  await controller.getStatus(request(), status);
  assert.equal(status.body.data.state, "uncertain");
  assert.match(status.body.data.message, /do not resubmit/i);
  assert.equal(calls.refund, 0);
  assert.equal(calls.submit, 1);
  assert.equal(db.get("generation-1").metadata.lastPollErrorCode, "Throttling.RateQuota");
});

test("a persisted task recovers after an application restart without an in-memory status entry", async (t) => {
  const { calls, db } = setup(t);
  db.set("generation-1", {
    id: "generation-1", userId: "user-1", prompt: "Cinematic scene", url: "https://nebula.example/api/videos/generation-1/media", createdAt: new Date(), updatedAt: new Date(),
    metadata: { state: "pending", generationId: "generation-1", taskId: "task-1", model: "wan2.6-i2v-flash", submittedAt: new Date().toISOString(), acceptedAt: new Date().toISOString(), nextPollAt: null, pollAttempts: 0, chargedCredits: 2 },
  });
  const status = responseCapture();
  await controller.getStatus(request(), status);
  assert.equal(calls.poll, 1);
  assert.equal(status.body.data.taskId, "task-1");
  assert.equal(status.body.data.state, "running");
});

test("UNKNOWN task becomes expired after DashScope retention, refunds once, and is never resubmitted", async (t) => {
  const { calls, db } = setup(t);
  await controller.generate(request(), responseCapture());
  const persisted = db.get("generation-1");
  db.set("generation-1", { ...persisted, metadata: { ...persisted.metadata, acceptedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), nextPollAt: null } });
  videoGenerationService.getTaskStatus = async () => ({ status: "UNKNOWN", taskId: "task-1" });
  const response = responseCapture();
  await controller.getStatus(request(), response);
  assert.equal(response.body.data.state, "expired");
  assert.equal(calls.refund, 1);
  assert.equal(calls.submit, 1);
  const terminalPoll = responseCapture();
  await controller.getStatus(request(), terminalPoll);
  assert.equal(terminalPoll.body.data.state, "expired");
  assert.equal(calls.refund, 1);
  assert.equal(calls.poll, 0);
});

test("restart before credit charge marks the request safe to retry without submitting a provider task", async (t) => {
  const { calls, db } = setup(t);
  db.set("generation-1", {
    id: "generation-1", userId: "user-1", prompt: "Cinematic scene", url: "https://nebula.example/api/videos/generation-1/media", createdAt: new Date(Date.now() - 60_000), updatedAt: new Date(),
    metadata: { state: "submitting", generationId: "generation-1", submittedAt: new Date(Date.now() - 60_000).toISOString(), nextPollAt: null },
  });
  const status = responseCapture();
  await controller.getStatus(request(), status);
  assert.equal(status.body.data.state, "failed");
  assert.match(status.body.data.message, /safely start a new request/);
  assert.equal(calls.charge, 0);
  assert.equal(calls.submit, 0);
});

test("an uncertain submission timeout is not refunded or automatically resubmitted", async (t) => {
  const { calls } = setup(t, async () => { throw Object.assign(new Error("Network timeout"), { providerStatus: 504, providerCode: "TaskTimeout" }); });
  const res = responseCapture();
  await controller.generate(request(), res);
  assert.equal(res.statusCode, 202);
  assert.equal(calls.charge, 1);
  assert.equal(calls.refund, 0);
  const repeat = responseCapture();
  await controller.generate(request(), repeat);
  assert.equal(calls.submit, 1);
  assert.equal(repeat.body.data.state, "submission_unknown");
});

test("an accepted task whose initial database write fails remains identifiable and cannot be resubmitted", async (t) => {
  const { calls, db } = setup(t, async () => {
    throw Object.assign(new Error("Task ID persistence failed"), {
      provider: "alibaba", providerCode: "TASK_ID_PERSISTENCE_FAILED", classification: "TASK_STILL_RUNNING",
      taskId: "task-accepted-1", model: "wan2.6-i2v-flash",
    });
  });
  const response = responseCapture();
  await controller.generate(request(), response);
  assert.equal(response.statusCode, 202);
  assert.equal(db.get("generation-1").metadata.taskId, "task-accepted-1");
  assert.equal(db.get("generation-1").metadata.state, "uncertain");
  assert.equal(calls.refund, 0);
  const repeat = responseCapture();
  await controller.generate(request(), repeat);
  assert.equal(calls.submit, 1);
  assert.equal(repeat.body.data.taskId, "task-accepted-1");
});
