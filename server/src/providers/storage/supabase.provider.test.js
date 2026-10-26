const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const storage = require("./supabase.provider");

function setupEnv(t) {
  const keys = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_MEDIA_BUCKET", "SUPABASE_MEDIA_MAX_FILE_BYTES"];
  const old = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  process.env.SUPABASE_URL = "https://nebula-test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-secret";
  process.env.SUPABASE_MEDIA_BUCKET = "nebula-media";
  t.after(() => {
    for (const key of keys) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  });
}

test("uploads private media with backend credentials and ownership-scoped object path", async (t) => {
  setupEnv(t);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "nebula-supabase-upload-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "frame.png");
  await fs.writeFile(filePath, Buffer.from("png-bytes"));
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let captured;
  global.fetch = async (url, options) => {
    const chunks = [];
    for await (const chunk of options.body) chunks.push(chunk);
    captured = { url: String(url), options, body: Buffer.concat(chunks) };
    return new Response(JSON.stringify({ Key: "stored" }), { status: 200 });
  };

  const result = await storage.uploadFile({
    filePath,
    objectPath: "users/user-1/images/gen-1/frame.png",
    userId: "user-1",
    generationId: "gen-1",
    contentType: "image/png",
  });

  assert.match(captured.url, /\/storage\/v1\/object\/nebula-media\/users\/user-1\/images\/gen-1\/frame\.png$/);
  assert.equal(captured.options.headers.Authorization, "Bearer test-service-role-secret");
  assert.equal(captured.options.headers.apikey, "test-service-role-secret");
  assert.equal(captured.options.headers["x-upsert"], "false");
  assert.equal(captured.body.toString(), "png-bytes");
  assert.equal(result.provider, "supabase");
  assert.equal(result.bucket, "nebula-media");
  assert.equal(result.size, 9);
  assert.equal(JSON.stringify(result).includes("test-service-role-secret"), false);
});

test("video retry uses a stable private object path with upsert enabled", async (t) => {
  setupEnv(t);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "nebula-video-upsert-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "video.mp4");
  await fs.writeFile(filePath, Buffer.from("video-bytes"));
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let headers;
  global.fetch = async (_url, options) => { headers = options.headers; for await (const _chunk of options.body) {} return new Response("{}", { status: 200 }); };
  await storage.uploadFile({ filePath, objectPath: "users/user-1/videos/gen-1/gen-1.mp4", userId: "user-1", generationId: "gen-1", contentType: "video/mp4", upsert: true });
  assert.equal(headers["x-upsert"], "true");
});

test("retries transient upload failures and rejects cross-owner object paths", async (t) => {
  setupEnv(t);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "nebula-supabase-retry-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "clip.mp4");
  await fs.writeFile(filePath, Buffer.from("video"));
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let attempts = 0;
  global.fetch = async (_url, options) => {
    for await (const _chunk of options.body) { /* drain each retry stream */ }
    attempts += 1;
    if (attempts < 3) return new Response(JSON.stringify({ message: "temporary" }), { status: 503 });
    return new Response("{}", { status: 200 });
  };
  await storage.uploadFile({ filePath, objectPath: "users/user-1/videos/gen-1/clip.mp4", userId: "user-1", contentType: "video/mp4" });
  assert.equal(attempts, 3);

  await assert.rejects(
    storage.uploadFile({ filePath, objectPath: "users/other/videos/gen-1/clip.mp4", userId: "user-1", contentType: "video/mp4" }),
    (error) => error.status === 403,
  );
  assert.equal(attempts, 3);
});

test("creates short-lived signed URLs and includes a sanitized download filename", async (t) => {
  setupEnv(t);
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let request;
  global.fetch = async (url, options) => {
    request = { url: String(url), options };
    return new Response(JSON.stringify({ signedURL: "/object/sign/nebula-media/users/u1/images/g1/a.png?token=temporary" }), { status: 200 });
  };
  const url = await storage.createSignedUrl({
    bucket: "nebula-media",
    objectPath: "users/u1/images/g1/a.png",
    userId: "u1",
    expiresIn: 60,
    downloadName: "My/image.png",
  });
  assert.equal(request.url, "https://nebula-test.supabase.co/storage/v1/object/sign/nebula-media/users/u1/images/g1/a.png");
  assert.deepEqual(JSON.parse(request.options.body), { expiresIn: 60 });
  assert.equal(new URL(url).origin, "https://nebula-test.supabase.co");
  assert.equal(new URL(url).pathname, "/storage/v1/object/sign/nebula-media/users/u1/images/g1/a.png");
  assert.equal(new URL(url).searchParams.get("download"), "My_image.png");
  await assert.rejects(storage.createSignedUrl({ bucket: "nebula-media", objectPath: "users/u2/images/g1/a.png", userId: "u1" }), (error) => error.status === 403);
});

test("enforces the Free-plan default maximum and refuses partial configuration", async (t) => {
  setupEnv(t);
  assert.equal(storage.getConfiguredMaxFileBytes(), 50 * 1024 * 1024);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "nebula-supabase-limit-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "clip.mp4");
  await fs.writeFile(filePath, Buffer.from("12345"));
  process.env.SUPABASE_MEDIA_MAX_FILE_BYTES = "4";
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let called = false;
  global.fetch = async () => { called = true; return new Response("{}", { status: 200 }); };
  await assert.rejects(storage.uploadFile({ filePath, objectPath: "users/u1/videos/g1/clip.mp4", userId: "u1", contentType: "video/mp4" }), (error) => error.status === 413);
  assert.equal(called, false);

  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(() => storage.getBucket(), /requires both SUPABASE_URL/);
});
