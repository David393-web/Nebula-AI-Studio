const API_BASE_URL =
  process.env.DASHSCOPE_API_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/api/v1";

const MODEL = "wan2.6-i2v-flash";

const POLL_INTERVAL_MS = 15000;
const MAX_WAIT_MS = 5 * 60 * 1000;

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

  return Math.min(
    15,
    Math.max(2, Math.round(value)),
  );
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/*
 * ----------------------------------------
 * Convert image URL → Base64 data URI
 * ----------------------------------------
 *
 * Alibaba Wan accepts Base64 image input.
 *
 * This is important because AI-provider
 * delivery URLs such as Replicate URLs can
 * expire.
 * ----------------------------------------
 */
async function imageUrlToDataUri(imageUrl) {
  if (
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    throw new Error(
      "A valid storyboard image URL is required.",
    );
  }

  if (imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  console.log(
    "[Alibaba Video] Downloading storyboard image...",
  );

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Storyboard image could not be downloaded. HTTP ${response.status}: ${response.statusText}`,
    );
  }

  const contentType =
    response.headers.get("content-type") ||
    "image/webp";

  if (!contentType.startsWith("image/")) {
    throw new Error(
      `Storyboard URL did not return an image. Content-Type: ${contentType}`,
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error(
      "Storyboard image download returned an empty file.",
    );
  }

  /*
   * Wan 2.6 supports images up to 20 MB.
   */
  const maxBytes =
    20 * 1024 * 1024;

  if (buffer.length > maxBytes) {
    throw new Error(
      "Storyboard image is larger than Alibaba Wan's 20 MB input limit.",
    );
  }

  const base64 =
    buffer.toString("base64");

  console.log(
    `[Alibaba Video] Storyboard image downloaded: ${(
      buffer.length /
      1024 /
      1024
    ).toFixed(2)} MB`,
  );

  return `data:${contentType};base64,${base64}`;
}

async function createVideoTask({
  imageData,
  prompt,
  duration,
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
          resolution: "720P",
          prompt_extend: true,
          duration: getDuration(duration),
          audio: false,
          watermark: false,
        },
      }),
    },
  );

  const data = await response.json();

  console.log(
    "========================================",
  );
  console.log(
    "ALIYUN VIDEO TASK CREATION",
  );
  console.log(
    "HTTP status:",
    response.status,
  );
  console.dir(data, {
    depth: 10,
  });
  console.log(
    "========================================",
  );

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.output?.message ||
        `Alibaba video task creation failed with HTTP ${response.status}.`,
    );
  }

  const taskId =
    data?.output?.task_id;

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
  const startedAt =
    Date.now();

  while (
    Date.now() - startedAt <
    MAX_WAIT_MS
  ) {
    const data =
      await getVideoTask(taskId);

    const output =
      data?.output || {};

    const status =
      output?.task_status;

    console.log(
      `[Alibaba Video] Task ${taskId} status: ${status}`,
    );

    if (
      status === "SUCCEEDED"
    ) {
      if (!output.video_url) {
        throw new Error(
          "Alibaba video generation succeeded but no video URL was returned.",
        );
      }

      return {
        url: output.video_url,

        taskId,

        requestId:
          data?.request_id ||
          null,

        duration:
          output?.usage
            ?.output_video_duration ||
          output?.usage?.duration ||
          5,
      };
    }

    if (
      status === "FAILED" ||
      status === "CANCELED"
    ) {
      throw new Error(
        output?.message ||
          `Alibaba video generation ${status.toLowerCase()}.`,
      );
    }

    if (
      status === "UNKNOWN"
    ) {
      throw new Error(
        "Alibaba video task became unavailable.",
      );
    }

    await sleep(
      POLL_INTERVAL_MS,
    );
  }

  throw new Error(
    "Alibaba video generation timed out after 5 minutes.",
  );
}

async function generateVideo({
  imageUrl,
  prompt,
  duration = 5,
}) {
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

  console.log(
    "========================================",
  );
  console.log(
    "ALIBABA WAN VIDEO REQUEST",
  );
  console.log(
    "Model:",
    MODEL,
  );
  console.log(
    "Source image:",
    imageUrl,
  );
  console.log(
    "Prompt:",
    prompt,
  );
  console.log(
    "Duration:",
    getDuration(duration),
  );
  console.log(
    "Resolution:",
    "720P",
  );
  console.log(
    "Audio:",
    false,
  );
  console.log(
    "========================================",
  );

  /*
   * Convert the temporary provider URL
   * into Base64 BEFORE sending it to Alibaba.
   */
  const imageData =
    await imageUrlToDataUri(
      imageUrl,
    );

  console.log(
    "[Alibaba Video] Image converted to Base64 successfully.",
  );

  const taskId =
    await createVideoTask({
      imageData,
      prompt,
      duration,
    });

  console.log(
    `[Alibaba Video] Created task: ${taskId}`,
  );

  const result =
    await waitForVideo(taskId);

  console.log(
    "========================================",
  );
  console.log(
    "ALIBABA WAN VIDEO SUCCESS",
  );
  console.log(
    "Task ID:",
    result.taskId,
  );
  console.log(
    "Video URL:",
    result.url,
  );
  console.log(
    "========================================",
  );

  return {
    provider: "alibaba",
    model: MODEL,
    url: result.url,
    type: "video",
    duration: result.duration,
    taskId: result.taskId,
    requestId: result.requestId,
    createdAt:
      new Date().toISOString(),
  };
}

module.exports = {
  generateVideo,
};