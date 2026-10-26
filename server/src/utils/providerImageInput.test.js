const assert = require("node:assert/strict");
const test = require("node:test");
const imageService = require("../services/Image/image.service");
const supabaseStorage = require("../providers/storage/supabase.provider");
const providerImageInput = require("./providerImageInput");

test("loads an owned Supabase reference image into the existing provider image input format", async (t) => {
  const originalGetImage = imageService.getImage;
  const originalDownload = supabaseStorage.downloadObject;
  let downloadArgs;
  imageService.getImage = async (id, userId) => {
    assert.equal(id, "image-1");
    assert.equal(userId, "user-1");
    return {
      id,
      userId,
      metadata: {
        storageProvider: "supabase",
        storageBucket: "nebula-media",
        storageKey: "users/user-1/images/g1/ref.png",
        storageMimeType: "image/png",
      },
    };
  };
  supabaseStorage.downloadObject = async (args) => {
    downloadArgs = args;
    return { data: Buffer.from("ref-bytes"), contentType: "image/png" };
  };
  t.after(() => {
    imageService.getImage = originalGetImage;
    supabaseStorage.downloadObject = originalDownload;
  });
  const input = await providerImageInput("https://api.nebula.test/api/images/image-1/media", "user-1", "https://api.nebula.test");
  assert.deepEqual(downloadArgs, {
    bucket: "nebula-media",
    objectPath: "users/user-1/images/g1/ref.png",
    userId: "user-1",
    maxBytes: 20 * 1024 * 1024,
  });
  assert.equal(input, `data:image/png;base64,${Buffer.from("ref-bytes").toString("base64")}`);
});
