const assert = require("node:assert/strict");
const test = require("node:test");
const storage = require("../providers/storage/supabase.provider");
const sendStoredMedia = require("./sendStoredMedia");

function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    type(value) { this.contentType = value; return this; },
    status(code) { this.statusCode = code; return this; },
    send(value) { this.body = value; return this; },
  };
}

function privateMedia() {
  return {
    id: "image-1",
    userId: "user-1",
    name: "A nebula image",
    metadata: {
      storageProvider: "supabase",
      storageBucket: "nebula-media",
      storageKey: "users/user-1/images/gen-1/image.webp",
      ownerUserId: "user-1",
      storageMimeType: "image/webp",
    },
  };
}

test("authorized playback proxies private media without exposing a signed URL", async (t) => {
  const previousBucket = process.env.SUPABASE_MEDIA_BUCKET;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_MEDIA_BUCKET = "nebula-media";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
  const originalDownload = storage.downloadObject;
  const originalMaxBytes = storage.getConfiguredMaxFileBytes;
  t.after(() => {
    storage.downloadObject = originalDownload;
    storage.getConfiguredMaxFileBytes = originalMaxBytes;
    for (const [key, value] of [["SUPABASE_MEDIA_BUCKET", previousBucket], ["SUPABASE_URL", previousUrl], ["SUPABASE_SERVICE_ROLE_KEY", previousKey]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  let request;
  storage.getConfiguredMaxFileBytes = () => 50 * 1024 * 1024;
  storage.downloadObject = async (args) => { request = args; return { data: Buffer.from("private-image"), contentType: "image/webp" }; };
  const res = response();
  await sendStoredMedia(res, privateMedia(), "nebula-image");
  assert.equal(request.userId, "user-1");
  assert.equal(request.objectPath, "users/user-1/images/gen-1/image.webp");
  assert.equal(request.maxBytes, 50 * 1024 * 1024);
  assert.equal(res.statusCode, 200);
  assert.equal(res.contentType, "image/webp");
  assert.equal(res.body.toString(), "private-image");
  assert.equal(JSON.stringify(res).includes("signed"), false);
  assert.equal(res.headers["Cache-Control"], "private, no-store");
  assert.equal(res.headers["Referrer-Policy"], "no-referrer");
});

test("authorized download proxies media with a safe attachment filename", async (t) => {
  const originalDownload = storage.downloadObject;
  const previousBucket = process.env.SUPABASE_MEDIA_BUCKET;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_MEDIA_BUCKET = "nebula-media";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
  t.after(() => {
    storage.downloadObject = originalDownload;
    for (const [key, value] of [["SUPABASE_MEDIA_BUCKET", previousBucket], ["SUPABASE_URL", previousUrl], ["SUPABASE_SERVICE_ROLE_KEY", previousKey]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  storage.downloadObject = async () => ({ data: Buffer.from("video"), contentType: "video/mp4" });
  const res = response();
  await sendStoredMedia(res, privateMedia(), "nebula-image", { download: true });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Content-Disposition"], 'attachment; filename="A nebula image.webp"');
  assert.equal(res.body.toString(), "video");
});

test("rejects owner metadata mismatches and never reads a foreign user's object", async (t) => {
  const originalDownload = storage.downloadObject;
  const previousBucket = process.env.SUPABASE_MEDIA_BUCKET;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_MEDIA_BUCKET = "nebula-media";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "secret";
  t.after(() => {
    storage.downloadObject = originalDownload;
    for (const [key, value] of [["SUPABASE_MEDIA_BUCKET", previousBucket], ["SUPABASE_URL", previousUrl], ["SUPABASE_SERVICE_ROLE_KEY", previousKey]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  let called = false;
  storage.downloadObject = async () => { called = true; return { data: Buffer.alloc(0), contentType: "image/png" }; };
  const media = privateMedia();
  media.metadata.storageKey = "users/user-2/images/gen-1/image.webp";
  await assert.rejects(sendStoredMedia(response(), media, "nebula-image"), (error) => error.status === 403);
  assert.equal(called, false);
});
