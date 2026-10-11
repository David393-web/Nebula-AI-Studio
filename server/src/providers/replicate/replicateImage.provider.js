const fs = require("node:fs/promises");
const path = require("node:path");

const getReplicateClient = async () => {
  if (process.env.REPLICATE_IMAGE_ENABLED === "false") {
    throw new Error("Image generation is disabled by server configuration.");
  }
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "REPLICATE_API_TOKEN is not configured on the server.",
    );
  }

  const { default: Replicate } = await import("replicate");

  return new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
};

const MODEL = process.env.REPLICATE_IMAGE_MODEL || "black-forest-labs/flux-2-pro";
const MAX_REFERENCE_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_REFERENCE_IMAGES = 8;
const VALID_ASPECT_RATIOS = new Set(["1:1", "16:9", "9:16", "4:3", "3:4", "match_input_image"]);

function invalidReference(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function moderationStage(message = "") {
  const mentionsInput = /\binput\b/i.test(message);
  const mentionsOutput = /\boutput\b/i.test(message);
  if (mentionsInput && mentionsOutput) return "unspecified";
  if (mentionsInput && /(flag|reject|sensitiv|moderation)/i.test(message)) return "input";
  if (mentionsOutput && /(flag|reject|sensitiv|moderation)/i.test(message)) return "output";
  return "unspecified";
}

const IMAGE_TYPES = {
  ".jpg": { mime: "image/jpeg", matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  ".jpeg": { mime: "image/jpeg", matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  ".png": { mime: "image/png", matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  ".gif": { mime: "image/gif", matches: (bytes) => bytes.subarray(0, 3).toString("ascii") === "GIF" },
  ".webp": { mime: "image/webp", matches: (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP" },
};

function localImageBlob(buffer, mime, filename, index) {
  if (!buffer.length || buffer.length > MAX_REFERENCE_IMAGE_BYTES) {
    throw invalidReference(`Reference image ${index + 1} must be between 1 byte and 20 MB.`);
  }
  const type = Object.values(IMAGE_TYPES).find((candidate) => candidate.mime === mime);
  if (!type?.matches(buffer)) {
    throw invalidReference(`Reference image ${index + 1} is not valid ${mime} image data.`);
  }
  const blob = new Blob([buffer], { type: mime });
  Object.defineProperty(blob, "name", { value: filename || `reference-${index + 1}` });
  return blob;
}

async function normalizeReferenceImage(value, index) {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidReference(`Reference image ${index + 1} must be a valid image URL.`);
  }

  const dataUri = value.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (dataUri) {
    const buffer = Buffer.from(dataUri[2], "base64");
    if (buffer.toString("base64") !== dataUri[2]) {
      throw invalidReference(`Reference image ${index + 1} has invalid base64 data.`);
    }
    const mime = dataUri[1].toLowerCase();
    const extension = Object.keys(IMAGE_TYPES).find((ext) => IMAGE_TYPES[ext].mime === mime) || ".img";
    return localImageBlob(buffer, mime, `reference-${index + 1}${extension}`, index);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw invalidReference(`Reference image ${index + 1} is not a valid absolute URL or supported image data URI.`);
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw invalidReference(`Reference image ${index + 1} must use a public HTTP or HTTPS URL.`);
  }

  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.pathname.startsWith("/uploads/")) {
    const uploadsRoot = path.resolve(__dirname, "../../../uploads");
    const relativePath = decodeURIComponent(url.pathname.slice("/uploads/".length));
    const localPath = path.resolve(uploadsRoot, relativePath);
    if (!localPath.startsWith(`${uploadsRoot}${path.sep}`)) {
      throw invalidReference(`Reference image ${index + 1} has an invalid upload path.`);
    }
    try {
      const buffer = await fs.readFile(localPath);
      if (buffer.length > MAX_REFERENCE_IMAGE_BYTES) throw invalidReference(`Reference image ${index + 1} exceeds 20 MB.`);
      const extension = path.extname(localPath).toLowerCase();
      const imageType = IMAGE_TYPES[extension];
      if (!imageType) throw invalidReference(`Reference image ${index + 1} uses an unsupported image format.`);
      return localImageBlob(buffer, imageType.mime, path.basename(localPath), index);
    } catch (error) {
      if (error.code === "ENOENT" && !isLocalHost) return url.href;
      if (error.code === "ENOENT") throw invalidReference(`Reference image ${index + 1} is missing from server uploads.`);
      throw error;
    }
  }
  if (isLocalHost) {
    throw invalidReference(`Reference image ${index + 1} points to a local URL Replicate cannot access.`);
  }
  return url.href;
}

function normalizeOutput(output) {
  if (!output) {
    return null;
  }

  /*
   * FLUX.2 Pro normally returns a FileOutput
   * with a .url() method.
   */
  if (typeof output.url === "function") {
    return output.url();
  }

  /*
   * Some Replicate models return an array
   * of FileOutput objects.
   */
  if (Array.isArray(output)) {
    const firstOutput = output[0];

    if (!firstOutput) {
      return null;
    }

    if (typeof firstOutput.url === "function") {
      return firstOutput.url();
    }

    if (typeof firstOutput === "string") {
      return firstOutput;
    }

    if (firstOutput.url) {
      return firstOutput.url;
    }
  }

  /*
   * Handle plain URL/string responses.
   */
  if (typeof output === "string") {
    return output;
  }

  if (output.url) {
    return output.url;
  }

  return null;
}

async function generateImage({
  prompt,
  aspectRatio = "1:1",
  inputImages = [],
  resolution = "1 MP",
  outputFormat = "webp",
  outputQuality = 80,
}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("A valid image prompt is required.");
  }
  if (!VALID_ASPECT_RATIOS.has(aspectRatio)) {
    throw invalidReference("Choose a supported image aspect ratio.");
  }

  const references = Array.isArray(inputImages) ? [...new Set(inputImages)] : [];
  if (references.length > MAX_REFERENCE_IMAGES) {
    throw invalidReference(`FLUX.2 Pro accepts up to ${MAX_REFERENCE_IMAGES} reference images.`);
  }
  const normalizedImages = await Promise.all(references.map(normalizeReferenceImage));
  const replicate = await getReplicateClient();

  const input = {
    prompt: prompt.trim(),
    resolution,
    aspect_ratio: aspectRatio,
    input_images: normalizedImages,
    output_format: outputFormat,
    output_quality: outputQuality,
    safety_tolerance: 2,
  };

  let prediction = null;
  let output;
  try {
    output = await replicate.run(MODEL, { input }, (progress) => {
      prediction = progress;
    });
  } catch (error) {
    const statusMatch = String(prediction?.error || error.message || "").match(/\b(4\d\d|5\d\d)\b/);
    const providerError = prediction?.error || error.message || "Replicate image generation failed.";
    const wrapped = new Error(providerError, { cause: error });
    wrapped.provider = "replicate";
    wrapped.providerMessage = providerError;
    if (/\bE005\b/i.test(providerError)) {
      wrapped.code = "CONTENT_SAFETY_REJECTED";
      wrapped.providerCode = "E005";
      wrapped.moderationStage = moderationStage(providerError);
      wrapped.message = "The image provider rejected this generation request as sensitive. Try adjusting the scene description or visual intensity.";
    }
    wrapped.providerStatus = statusMatch ? Number(statusMatch[1]) : null;
    wrapped.requestId = prediction?.id || null;
    wrapped.model = MODEL;
    wrapped.providerCallStarted = true;
    throw wrapped;
  }

  const url = normalizeOutput(output);

  if (!url) {
    throw new Error(
      "Replicate completed the generation but did not return an image URL.",
    );
  }

  return {
    provider: "replicate",
    model: MODEL,
    url,
    type: "image",
  };
}

module.exports = {
  generateImage,
};
