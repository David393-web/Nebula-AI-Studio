const API_BASE_URL =
  process.env.DASHSCOPE_API_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/api/v1";

const MODEL = process.env.ALIBABA_VIDEO_MODEL || "wan2.6-i2v-flash";
const PROMPT_EXTEND = process.env.ALIBABA_PROMPT_EXTEND === "true";

const POLL_INTERVAL_MS = 15000;
const MAX_WAIT_MS = 5 * 60 * 1000 + 30 * 1000;

function getApiKey() {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY is not configured on the server.",
    );
  }

  return apiKey;
}

function getDuration(duration) {
  const value = Number(duration);

  if (!Number.isFinite(value)) {
    return 5;
  }

  // Alibaba requires an integer between 2 and 15 seconds.
  return Math.min(
    15,
    Math.max(2, Math.round(value)),
  );
}

function getResolution(resolution) {
  return resolution === "720P" || resolution === "1080P"
    ? resolution
    : "1080P";
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function imageUrlToDataUri(imageUrl) {
  if (imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Storyboard image could not be downloaded. HTTP ${response.status}.`,
    );
  }

  const contentType = (response.headers.get("content-type") || "")
    .split(";", 1)[0]
    .toLowerCase();
  const supportedTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/bmp",
    "image/webp",
  ]);

  if (!supportedTypes.has(contentType)) {
    throw new Error(
      "Storyboard image must be a JPEG, PNG, BMP, or WEBP file.",
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const maxBytes = 20 * 1024 * 1024;

  if (!buffer.length) {
    throw new Error("Storyboard image download returned an empty file.");
  }

  if (buffer.length > maxBytes) {
    throw new Error("Storyboard image is larger than Wan's 20 MB input limit.");
  }

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function createVideoTask({
  imageData,
  prompt,
  duration,
  resolution,
}) {
  const apiKey = getApiKey();

  const response = await fetch(
    `${API_BASE_URL}/services/aigc/video-generation/video-synthesis`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: MODEL,

        input: {
          prompt: prompt.trim(),
          img_url: imageData,
        },

        parameters: {
          resolution: getResolution(resolution),
          // Prompt rewriting improves short prompts but adds processing time.
          prompt_extend: PROMPT_EXTEND,
          duration: getDuration(duration),
          audio: false,
          watermark: false,
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(`Alibaba video generation request failed (HTTP ${response.status}).`);
    error.provider = "alibaba";
    error.providerStatus = response.status;
    error.quotaExhausted = response.status === 403;
    throw error;
  }

  const taskId = data?.output?.task_id;

  if (!taskId) {
    throw new Error(
      "Alibaba created the request but did not return a task ID.",
    );
  }

  return taskId;
}

async function getVideoTask(taskId) {
  const apiKey = getApiKey();

  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.output?.message ||
        `Alibaba video task query failed with HTTP ${response.status}.`,
    );
  }

  return data;
}

async function waitForVideo(taskId) {
  const startedAt = Date.now();

  while (true) {
    const data = await getVideoTask(taskId);

    const output = data?.output || {};
    const status = output?.task_status;

    if (status === "SUCCEEDED") {
      if (!output.video_url) {
        throw new Error(
          "Alibaba video generation succeeded but no video URL was returned.",
        );
      }

      return {
        url: output.video_url,
        taskId,
        requestId: data?.request_id || null,
        duration:
          output?.usage?.output_video_duration ||
          output?.usage?.duration ||
          5,
      };
    }

    if (
      status === "FAILED" ||
      status === "CANCELED"
    ) {
      const error = new Error(`Alibaba video generation ${status.toLowerCase()}.`);
      error.provider = "alibaba";
      error.providerStatus = status;
      throw error;
    }

    if (status === "UNKNOWN") {
      throw new Error(
        "Alibaba video task became unavailable.",
      );
    }

    if (Date.now() - startedAt >= MAX_WAIT_MS) {
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    "Alibaba video generation timed out after 5 minutes.",
  );
}

async function generateVideo({
  imageUrl,
  prompt,
  duration = 5,
  resolution,
}) {
  if (process.env.ALIBABA_VIDEO_ENABLED === "false") {
    const error = new Error("Video generation is disabled by server configuration.");
    error.status = 503;
    throw error;
  }
  if (process.env.VIDEO_PRIMARY_PROVIDER && process.env.VIDEO_PRIMARY_PROVIDER !== "alibaba") {
    const error = new Error("The configured primary video provider is not implemented.");
    error.status = 503;
    throw error;
  }
  if (
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    throw new Error(
      "A valid storyboard image URL is required.",
    );
  }

  if (
    !prompt ||
    typeof prompt !== "string"
  ) {
    throw new Error(
      "A valid video prompt is required.",
    );
  }

  const imageData = await imageUrlToDataUri(imageUrl);

  const taskId = await createVideoTask({
    imageData,
    prompt,
    duration,
    resolution,
  });

  const result = await waitForVideo(taskId);

  return {
    provider: "alibaba",
    model: MODEL,
    url: result.url,
    type: "video",
    duration: result.duration,
    taskId: result.taskId,
    requestId: result.requestId,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  generateVideo,
};
