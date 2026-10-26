const assert = require("node:assert/strict");
const test = require("node:test");
const controller = require("./VideoController");
const videoService = require("../services/Video/video.service");

test("private video playback and download stop when the owner check fails", async () => {
  const originalGetVideo = videoService.getVideo;
  let lookups = 0;
  videoService.getVideo = async (id, userId) => {
    lookups += 1;
    assert.equal(id, "video-1");
    assert.equal(userId, "intruder");
    const error = new Error("You do not have access to this video");
    error.status = 403;
    throw error;
  };
  try {
    const req = { params: { id: "video-1" }, user: { userId: "intruder" } };
    for (const action of [controller.media, controller.download]) {
      let forwarded;
      await action.call(controller, req, {}, (error) => { forwarded = error; });
      assert.equal(forwarded.status, 403);
    }
    assert.equal(lookups, 2);
  } finally {
    videoService.getVideo = originalGetVideo;
  }
});
