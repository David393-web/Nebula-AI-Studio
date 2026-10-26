import test from "node:test";
import assert from "node:assert/strict";
import { waitForVideoGeneration } from "./videoGenerationPolling.js";

function mockApi(states) {
  const calls = [];
  return {
    calls,
    get: async (path) => {
      calls.push(path);
      return { data: { data: states.shift() } };
    },
  };
}

test("polls pending and running states until completed, using only the status endpoint", async () => {
  const api = mockApi([
    { state: "pending", message: "Queued" },
    { state: "running", message: "Rendering" },
    { state: "completed", video: { id: "video-1", url: "/api/videos/video-1/media" } },
  ]);
  const seen = [];
  const video = await waitForVideoGeneration(api, "generation-1", (status) => seen.push(status.state), { intervalMs: 0 });
  assert.equal(video.id, "video-1");
  assert.deepEqual(seen, ["pending", "running", "completed"]);
  assert.equal(api.calls.length, 3);
  assert.ok(api.calls.every((path) => path.includes("/generation/video/status/")));
});

test("continues checking uncertain status without resubmitting", async () => {
  const api = mockApi([
    { state: "uncertain", message: "Do not resubmit" },
    { state: "completed", video: { id: "video-2" } },
  ]);
  assert.equal((await waitForVideoGeneration(api, "generation-2", () => {}, { intervalMs: 0 })).id, "video-2");
  assert.equal(api.calls.length, 2);
});

test("status 404 after an interrupted POST is treated as registration delay, not permission to resubmit", async () => {
  let checks = 0;
  const api = {
    calls: [],
    get: async (path) => {
      api.calls.push(path);
      checks += 1;
      if (checks === 1) throw { response: { status: 404 } };
      if (checks === 2) return { data: { data: { state: "pending", generationId: "generation-5" } } };
      return { data: { data: { state: "completed", generationId: "generation-5", video: { id: "video-5" } } } };
    },
    post: () => assert.fail("status recovery must never resubmit the video task"),
  };
  const states = [];
  const video = await waitForVideoGeneration(api, "generation-5", (status) => states.push(status.state), { intervalMs: 0 });
  assert.equal(video.id, "video-5");
  assert.deepEqual(states, ["checking_submission", "pending", "completed"]);
});

test("transient status failures retry the status endpoint without another generation POST", async () => {
  let checks = 0;
  const api = {
    get: async () => {
      checks += 1;
      if (checks === 1) throw { response: { status: 503 } };
      return { data: { data: { state: "completed", generationId: "generation-6", video: { id: "video-6" } } } };
    },
    post: () => assert.fail("poll recovery must never create a second task"),
  };
  const states = [];
  const video = await waitForVideoGeneration(api, "generation-6", (status) => states.push(status.state), { intervalMs: 0 });
  assert.equal(video.id, "video-6");
  assert.deepEqual(states, ["uncertain", "completed"]);
});

test("terminal failed and unknown submission states stop polling", async () => {
  const failed = mockApi([{ state: "failed", message: "Task failed" }]);
  await assert.rejects(waitForVideoGeneration(failed, "generation-3", () => {}, { intervalMs: 0 }), /Task failed/);
  assert.equal(failed.calls.length, 1);

  const unknown = mockApi([{ state: "submission_unknown", message: "Do not submit again" }]);
  await assert.rejects(waitForVideoGeneration(unknown, "generation-4", () => {}, { intervalMs: 0 }), /Do not submit again/);
  assert.equal(unknown.calls.length, 1);
});
