const { test } = require("node:test");
const assert = require("node:assert/strict");
const imageGenerationService = require("./imageGeneration.service");
const replicateImageProvider = require("../../providers/replicate/replicateImage.provider");

test("image generation forwards selected reference and character image assets to the provider", async (t) => {
  const original = replicateImageProvider.generateImage;
  t.after(() => { replicateImageProvider.generateImage = original; });
  let received;
  replicateImageProvider.generateImage = async (request) => {
    received = request;
    return { provider: "replicate", model: "flux-test", url: "https://provider.example/image.webp", type: "image" };
  };
  await imageGenerationService.generate({
    userId: "user-1",
    prompt: "Keep the same character",
    referenceImageUrls: ["data:image/png;base64,AA=="],
    characterImageUrl: "data:image/jpeg;base64,AQ==",
  });
  assert.deepEqual(received.inputImages, ["data:image/png;base64,AA==", "data:image/jpeg;base64,AQ=="]);
});
