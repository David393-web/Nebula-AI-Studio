const API_BASE_URL =
  process.env.DASHSCOPE_API_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/api/v1";

const MODEL = "wan2.6-i2v-flash";

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

async function createVideoTask({
  imageUrl,
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
          img_url: imageUrl,
        },

        parameters: {
          resolution: getResolution(resolution),
          prompt_extend: true,
          duration: getDuration(duration),
          audio: false,
          watermark: false,
        },
      }),
    },
  );

  const data = await response.json();

  console.log("========================================");
  console.log("ALIYUN VIDEO TASK CREATION");
  console.log("HTTP status:", response.status);
  console.dir(data, { depth: 10 });
  console.log("========================================");

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.output?.message ||
        `Alibaba video task creation failed with HTTP ${response.status}.`,
    );
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

    console.log(
      `[Alibaba Video] Task ${taskId} status: ${status}`,
    );

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
      throw new Error(
        output?.message ||
          `Alibaba video generation ${status.toLowerCase()}.`,
      );
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

  console.log("========================================");
  console.log("ALIBABA WAN VIDEO REQUEST");
  console.log("Model:", MODEL);
  console.log("Image URL:", imageUrl);
  console.log("Prompt:", prompt);
  console.log("Duration:", getDuration(duration));
  console.log("Resolution:", getResolution(resolution));
  console.log("Audio: false");
  console.log("========================================");

  const taskId = await createVideoTask({
    imageUrl,
    prompt,
    duration,
    resolution,
  });

  console.log(
    `[Alibaba Video] Created task: ${taskId}`,
  );

  const result = await waitForVideo(taskId);

  console.log("========================================");
  console.log("ALIBABA WAN VIDEO SUCCESS");
  console.log("Task ID:", result.taskId);
  console.log("Video URL:", result.url);
  console.log("========================================");

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
