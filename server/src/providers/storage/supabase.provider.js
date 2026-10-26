const fs = require("fs");
const retryTransient = require("../../utils/retryTransient");

const FREE_TIER_MAX_BYTES = 50 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60;

function getConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url && !serviceRoleKey) return null;
  if (!url || !serviceRoleKey) {
    const error = new Error("Supabase media storage requires both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    error.status = 500;
    throw error;
  }
  let parsed;
  try { parsed = new URL(url); } catch {
    const error = new Error("SUPABASE_URL must be a valid project URL.");
    error.status = 500;
    throw error;
  }
  if (!(["https:", "http:"].includes(parsed.protocol))) {
    const error = new Error("SUPABASE_URL must use HTTP or HTTPS.");
    error.status = 500;
    throw error;
  }
  return {
    url: parsed.origin,
    serviceRoleKey,
    bucket: process.env.SUPABASE_MEDIA_BUCKET?.trim() || "nebula-media",
    maxFileBytes: getMaxFileBytes(),
  };
}

function getMaxFileBytes() {
  const configured = process.env.SUPABASE_MEDIA_MAX_FILE_BYTES?.trim();
  if (!configured) return FREE_TIER_MAX_BYTES;
  const parsed = Number(configured);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    const error = new Error("SUPABASE_MEDIA_MAX_FILE_BYTES must be a positive integer.");
    error.status = 500;
    throw error;
  }
  return parsed;
}

function isConfigured() {
  return Boolean(process.env.SUPABASE_URL?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

function getBucket() {
  return getConfig()?.bucket || null;
}

function getConfiguredMaxFileBytes() {
  return getConfig()?.maxFileBytes || null;
}

function encodePath(value) {
  return String(value).split("/").map(encodeURIComponent).join("/");
}

function storageUrl(config, operation, bucket, objectPath) {
  const prefix = operation ? `object/${operation}/` : "object/";
  return `${config.url}/storage/v1/${prefix}${encodeURIComponent(bucket)}/${encodePath(objectPath)}`;
}

function responseError(response, payload, operation) {
  const error = new Error(`Supabase Storage ${operation} failed (HTTP ${response.status}).`);
  error.status = response.status;
  error.code = payload?.code || payload?.error || "SUPABASE_STORAGE_ERROR";
  return error;
}

function validateObjectLocation({ bucket, objectPath, userId }) {
  if (!bucket || bucket.includes("/")) throw new Error("Invalid Supabase media bucket.");
  if (typeof objectPath !== "string" || !objectPath || objectPath.startsWith("/") || objectPath.split("/").includes("..")) {
    throw new Error("Invalid Supabase media object path.");
  }
  if (userId && !objectPath.startsWith(`users/${userId}/`)) {
    const error = new Error("The requested media object does not belong to this user.");
    error.status = 403;
    throw error;
  }
}

async function uploadFile({ filePath, objectPath, bucket, contentType, userId, generationId, upsert = false }) {
  const config = getConfig();
  if (!config) return null;
  const chosenBucket = bucket || config.bucket;
  if (!userId) {
    const error = new Error("A media owner is required for Supabase uploads.");
    error.status = 400;
    throw error;
  }
  validateObjectLocation({ bucket: chosenBucket, objectPath, userId });
  const stat = await fs.promises.stat(filePath);
  if (stat.size > config.maxFileBytes) {
    const error = new Error(`Media exceeds the configured Supabase upload limit of ${Math.ceil(config.maxFileBytes / (1024 * 1024))} MB.`);
    error.status = 413;
    error.code = "SUPABASE_FILE_TOO_LARGE";
    throw error;
  }

  await retryTransient(async () => {
    const response = await fetch(storageUrl(config, "", chosenBucket, objectPath), {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": contentType || "application/octet-stream",
        "Content-Length": String(stat.size),
        "Cache-Control": "3600",
        "x-upsert": upsert ? "true" : "false",
      },
      body: fs.createReadStream(filePath),
      duplex: "half",
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) {
      let payload;
      try { payload = await response.json(); } catch { payload = null; }
      throw responseError(response, payload, "upload");
    }
    await response.body?.cancel();
  }, { attempts: 3, delayMs: 400 });

  return {
    provider: "supabase",
    bucket: chosenBucket,
    objectPath,
    size: stat.size,
    mimeType: contentType || "application/octet-stream",
  };
}

async function createSignedUrl({ bucket, objectPath, userId, downloadName, expiresIn = SIGNED_URL_TTL_SECONDS }) {
  const config = getConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  const chosenBucket = bucket || config.bucket;
  validateObjectLocation({ bucket: chosenBucket, objectPath, userId });
  const response = await fetch(storageUrl(config, "sign", chosenBucket, objectPath), {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: Math.min(Math.max(Number(expiresIn) || SIGNED_URL_TTL_SECONDS, 30), 300) }),
    signal: AbortSignal.timeout(15000),
  });
  let payload;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || typeof payload?.signedURL !== "string") {
    throw responseError(response, payload, "signed URL creation");
  }
  const signedUrl = /^https?:\/\//i.test(payload.signedURL)
    ? payload.signedURL
    : new URL(`/storage/v1${payload.signedURL.startsWith("/") ? payload.signedURL : `/${payload.signedURL}`}`, config.url).toString();
  return downloadName ? signedUrlSearch(signedUrl, downloadName).toString() : signedUrl;
}

function signedUrlSearch(value, downloadName) {
  const parsed = new URL(value);
  parsed.searchParams.set("download", String(downloadName).replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 100));
  return parsed;
}

async function downloadObject({ bucket, objectPath, userId, maxBytes }) {
  const config = getConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  const chosenBucket = bucket || config.bucket;
  validateObjectLocation({ bucket: chosenBucket, objectPath, userId });
  const response = await fetch(storageUrl(config, "authenticated", chosenBucket, objectPath), {
    headers: { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok || !response.body) {
    let payload;
    try { payload = await response.json(); } catch { payload = null; }
    throw responseError(response, payload, "download");
  }
  const declared = Number(response.headers.get("content-length"));
  if (maxBytes && Number.isFinite(declared) && declared > maxBytes) {
    await response.body.cancel();
    const error = new Error("The stored media exceeds the processing size limit.");
    error.status = 413;
    throw error;
  }
  const data = Buffer.from(await response.arrayBuffer());
  if (maxBytes && data.length > maxBytes) {
    const error = new Error("The stored media exceeds the processing size limit.");
    error.status = 413;
    throw error;
  }
  return { data, contentType: response.headers.get("content-type") || "application/octet-stream" };
}

module.exports = {
  FREE_TIER_MAX_BYTES,
  SIGNED_URL_TTL_SECONDS,
  isConfigured,
  getBucket,
  getConfiguredMaxFileBytes,
  uploadFile,
  createSignedUrl,
  downloadObject,
  validateObjectLocation,
};
