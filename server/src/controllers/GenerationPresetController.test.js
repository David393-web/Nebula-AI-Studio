const test = require("node:test");
const assert = require("node:assert/strict");
const { GenerationPresetController, validatePreset } = require("./GenerationPresetController");

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}
const validPreset = { name: "Portrait", type: "image", category: "Portrait", settings: { prompt: "A cinematic portrait", modelId: "auto", ratio: "1:1", quality: "High", referenceImageIds: ["owned-image"] } };

test("preset validation rejects unsupported or invalid values", () => {
  assert.equal(validatePreset(validPreset), null);
  assert.equal(validatePreset({ ...validPreset, settings: { ...validPreset.settings, duration: "5", audio: true } }), null);
  assert.match(validatePreset({ ...validPreset, settings: { ...validPreset.settings, ratio: "2:1" } }), /aspect ratio/);
  const videoPreset = { ...validPreset, type: "video", settings: { prompt: "A cinematic scene", modelId: "auto", quality: "720P" } };
  assert.equal(validatePreset({ ...videoPreset, settings: { ...videoPreset.settings, duration: "5", audio: true } }), null);
  assert.match(validatePreset({ ...videoPreset, settings: { ...videoPreset.settings, modelId: "alibaba-wan2.5-i2v-preview", duration: 7 } }), /duration/);
  assert.match(validatePreset({ ...videoPreset, settings: { ...videoPreset.settings, duration: 20 } }), /duration/);
  assert.match(validatePreset({ ...videoPreset, settings: { ...videoPreset.settings, audio: "yes" } }), /audio/);
  assert.match(validatePreset({ ...validPreset, name: " " }), /name/);
  assert.match(validatePreset({ ...validPreset, name: "x".repeat(81) }), /name/);
  assert.match(validatePreset({ ...validPreset, settings: { ...validPreset.settings, prompt: 3 } }), /prompt/);
  assert.match(validatePreset({ ...validPreset, settings: { ...validPreset.settings, prompt: "x".repeat(15001) } }), /prompt/);
  assert.match(validatePreset({ ...validPreset, settings: { ...validPreset.settings, modelId: 3 } }), /model/);
  assert.match(validatePreset({ ...validPreset, settings: { ...validPreset.settings, quality: "Extreme" } }), /quality/);
  assert.match(validatePreset({ ...validPreset, settings: { ...validPreset.settings, unknown: "x" } }), /unsupported settings/);
});

test("preset creation scopes ownership and validates referenced assets", async () => {
  let created;
  const db = {
    image: { async findMany({ where }) { assert.equal(where.userId, "user-1"); return [{ id: "owned-image" }]; } },
    generationPreset: { async create({ data }) { created = data; return { id: "preset-1", ...data }; } },
  };
  const controller = new GenerationPresetController(db); const res = response();
  await controller.create({ user: { id: "user-1" }, body: validPreset }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(created.userId, "user-1");
});

test("image presets save without video-only duration and audio settings", async () => {
  let created;
  const db = {
    image: { async findMany() { return []; } },
    generationPreset: { async create({ data }) { created = data; return { id: "image-preset", ...data }; } },
  };
  const res = response();
  await new GenerationPresetController(db).create({ user: { id: "user-1" }, body: { ...validPreset, settings: { ...validPreset.settings, referenceImageIds: [], duration: "5", audio: true } } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(Object.hasOwn(created.settings, "duration"), false);
  assert.equal(Object.hasOwn(created.settings, "audio"), false);
});

test("video presets save valid duration and list legacy records without duration", async () => {
  const videoPreset = { ...validPreset, type: "video", settings: { prompt: "A cinematic scene", modelId: "auto", quality: "720P", duration: "5" } };
  let created;
  const legacy = { id: "legacy-video", type: "video", settings: { prompt: "Older preset", modelId: "auto" } };
  const db = {
    image: { async findMany() { return []; } },
    generationPreset: {
      async create({ data }) { created = data; return { id: "video-preset", ...data }; },
      async findMany() { return [legacy]; },
    },
  };
  const controller = new GenerationPresetController(db);
  const createResponse = response();
  await controller.create({ user: { id: "user-1" }, body: videoPreset }, createResponse);
  assert.equal(createResponse.statusCode, 201);
  assert.equal(created.settings.duration, 5);
  const listResponse = response();
  await controller.list({ user: { id: "user-1" } }, listResponse);
  assert.deepEqual(listResponse.body.data.presets, [legacy]);
});

test("preset references cannot cross user boundaries", async () => {
  const db = {
    image: { async findMany() { return []; } },
    generationPreset: { async create() { assert.fail("must not create"); } },
  };
  const res = response();
  await new GenerationPresetController(db).create({ user: { id: "user-2" }, body: validPreset }, res);
  assert.equal(res.statusCode, 403);
});

test("preset character references must belong to the authenticated owner", async () => {
  const db = {
    image: { async findMany() { return []; } },
    character: { async findFirst({ where }) { assert.deepEqual(where, { id: "private-character", userId: "user-1" }); return null; } },
    generationPreset: { async create() { assert.fail("must not create"); } },
  };
  const res = response();
  await new GenerationPresetController(db).create({ user: { id: "user-1" }, body: { ...validPreset, settings: { ...validPreset.settings, referenceImageIds: [], characterId: "private-character" } } }, res);
  assert.equal(res.statusCode, 403);
});

test("preset list and mutations stay scoped to the authenticated owner", async () => {
  const db = {
    generationPreset: {
      async findMany({ where }) { assert.deepEqual(where, { userId: "user-1" }); return []; },
      async findFirst({ where }) { assert.deepEqual(where, { id: "foreign", userId: "user-1" }); return null; },
      async deleteMany({ where }) { assert.deepEqual(where, { id: "foreign", userId: "user-1" }); return { count: 0 }; },
    },
  };
  const controller = new GenerationPresetController(db);
  const listResponse = response(); await controller.list({ user: { id: "user-1" } }, listResponse);
  assert.deepEqual(listResponse.body.data.presets, []);
  const updateResponse = response(); await controller.update({ user: { id: "user-1" }, params: { id: "foreign" }, body: {} }, updateResponse);
  assert.equal(updateResponse.statusCode, 404);
  const deleteResponse = response(); await controller.remove({ user: { id: "user-1" }, params: { id: "foreign" } }, deleteResponse);
  assert.equal(deleteResponse.statusCode, 404);
});
