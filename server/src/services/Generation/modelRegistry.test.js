const test = require("node:test");
const assert = require("node:assert/strict");
const { getModelRegistry } = require("./modelRegistry");

test("model registry reports configured providers and verified capabilities", () => {
  const models = getModelRegistry({
    REPLICATE_IMAGE_MODEL: "black-forest-labs/flux-2-pro",
    REPLICATE_API_TOKEN: "configured",
    DASHSCOPE_API_KEY: "configured",
    ALIBABA_VIDEO_MODEL: "wan2.6-i2v-flash",
    VIDEO_ALIBABA_MODEL_CHAIN: "wan2.6-i2v-flash,wan2.2-i2v-plus",
  });
  assert.equal(models[0].id, "replicate-flux2-pro");
  assert.equal(models[0].apiModelId, "black-forest-labs/flux-2-pro");
  assert.equal(models[0].negativePrompt, false);
  assert.equal(models[0].maxReferenceImages, 8);
  const flash = models.find((model) => model.apiModelId === "wan2.6-i2v-flash");
  const plus = models.find((model) => model.apiModelId === "wan2.2-i2v-plus");
  assert.equal(flash.audio, true);
  assert.equal(flash.audioMode, "toggle");
  assert.deepEqual(flash.duration, { min: 2, max: 15 });
  assert.equal(plus.audio, false);
  assert.equal(plus.negativePrompt, false);
  assert.equal(models.some((model) => model.apiModelId === "wan2.7-i2v"), false);
});

test("model registry marks providers unavailable when credentials or feature flags are absent", () => {
  const models = getModelRegistry({ REPLICATE_IMAGE_ENABLED: "false", ALIBABA_VIDEO_ENABLED: "false" });
  assert.ok(models.every((model) => model.availability === "disabled"));
  assert.ok(models.every((model) => model.availabilityReason));
});
