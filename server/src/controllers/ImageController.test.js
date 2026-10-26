const assert = require("node:assert/strict");
const test = require("node:test");
const controller = require("./ImageController");
const imageService = require("../services/Image/image.service");

test("private image playback and download stop when the owner check fails", async () => {
  const originalGetImage = imageService.getImage;
  let lookups = 0;
  imageService.getImage = async (id, userId) => {
    lookups += 1;
    assert.equal(id, "image-1");
    assert.equal(userId, "intruder");
    const error = new Error("You do not have access to this image");
    error.status = 403;
    throw error;
  };
  try {
    const req = { params: { id: "image-1" }, user: { userId: "intruder" } };
    for (const action of [controller.media, controller.download]) {
      let forwarded;
      await action.call(controller, req, {}, (error) => { forwarded = error; });
      assert.equal(forwarded.status, 403);
    }
    assert.equal(lookups, 2);
  } finally {
    imageService.getImage = originalGetImage;
  }
});
