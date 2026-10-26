const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const storageService = require("./storage.service");

function saveEnv(t) {
  const keys = ["MEDIA_STORAGE_DIR", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_MEDIA_BUCKET", "SUPABASE_MEDIA_MAX_FILE_BYTES"];
  const old = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const key of keys) {
      if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key];
    }
  });
  return keys;
}

test("keeps local disk as fallback when Supabase is not configured", async (t) => {
  saveEnv(t);
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nebula-local-storage-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  process.env.MEDIA_STORAGE_DIR = root;
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => new Response(Buffer.from("image-bytes"), { status: 200, headers: { "content-type": "image/png" } });

  const saved = await storageService.saveRemoteImage("https://provider.invalid/image", { userId: "user-1", generationId: "generation-1" });
  assert.equal(saved.provider, "local");
  assert.equal(saved.bucket, null);
  assert.match(saved.storageKey, /^private\/users\/user-1\/images\//);
  assert.equal((await fs.readFile(path.join(root, saved.storageKey))).toString(), "image-bytes");
});

test("keeps the local fallback copy and reports failure when Supabase upload fails", async (t) => {
  saveEnv(t);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nebula-supabase-storage-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  process.env.MEDIA_STORAGE_DIR = root;
  process.env.SUPABASE_URL = "https://nebula-test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret";
  process.env.SUPABASE_MEDIA_BUCKET = "nebula-media";
  process.env.SUPABASE_MEDIA_MAX_FILE_BYTES = "52428800";
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let uploadAttempts = 0;
  global.fetch = async (url, options) => {
    if (String(url) === "https://provider.invalid/image") {
      return new Response(Buffer.from("image-bytes"), { status: 200, headers: { "content-type": "image/png" } });
    }
    for await (const _chunk of options.body) { /* consume upload body */ }
    uploadAttempts += 1;
    return new Response(JSON.stringify({ message: "storage unavailable" }), { status: 503 });
  };

  await assert.rejects(storageService.saveRemoteImage("https://provider.invalid/image", { userId: "user-1", generationId: "generation-1" }), (error) => error.status === 503);
  assert.equal(uploadAttempts, 3);
  const files = await fs.readdir(path.join(root, "private", "users", "user-1", "images"));
  assert.equal(files.length, 1);
  assert.equal((await fs.readFile(path.join(root, "private", "users", "user-1", "images", files[0]))).toString(), "image-bytes");
});
