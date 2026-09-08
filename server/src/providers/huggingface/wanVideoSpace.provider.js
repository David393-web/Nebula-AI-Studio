const { Client, handle_file } = require("@gradio/client");

const SPACE_ID = "Lightricks/LTX-2-3";

let clientPromise = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = Client.connect(
      SPACE_ID,
      process.env.HF_TOKEN
        ? {
            token: process.env.HF_TOKEN,
          }
        : undefined,
    );
  }

  return clientPromise;
}

function normalizeVideoOutput(output) {
  if (!output) {
    return null;
  }

  if (typeof output === "string") {
    return output;
  }

  if (output.url) {
    return output.url;
  }

  if (
    output.path &&
    /^https?:\/\//i.test(output.path)
  ) {
    return output.path;
  }

  if (output.video) {
    return normalizeVideoOutput(output.video);
  }

  if (output.data) {
    return normalizeVideoOutput(output.data);
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const normalized =
        normalizeVideoOutput(item);

      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

function getDimensions(aspectRatio = "16:9") {
  switch (aspectRatio) {
    case "9:16":
      return {
        width: 1024,
        height: 1536,
      };

    case "1:1":
      return {
        width: 1024,
        height: 1024,
      };

    case "4:3":
      return {
        width: 1024,
        height: 768,
      };

    case "3:4":
      return {
        width: 768,
        height: 1024,
      };

    case "21:9":
      return {
        width: 1536,
        height: 660,
      };

    case "16:9":
    default:
      return {
        width: 1536,
        height: 864,
      };
  }
}

async function generateVideo({
  imageUrl,
  prompt,
  duration = 3.5,
  aspectRatio = "16:9",
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

  const client = await getClient();

  const {
    width,
    height,
  } = getDimensions(aspectRatio);

  console.log("========================================");
  console.log("LTX-2.3 VIDEO REQUEST");
  console.log("Space:", SPACE_ID);
  console.log("Image URL:", imageUrl);
  console.log("Prompt:", prompt);
  console.log("Duration:", Number(duration) || 3.5);
  console.log("Width:", width);
  console.log("Height:", height);
  console.log("========================================");

  const imageFile = handle_file(imageUrl);

  console.log(
    "LTX image file prepared:",
    imageFile,
  );

  try {
    const result = await client.predict(
      "/generate_video",
      [
        imageFile,
        prompt.trim(),
        Number(duration) || 3.5,
        false,
        42,
        true,
        height,
        width,
      ],
    );

    console.log(
      "========================================",
    );
    console.log("LTX-2.3 RAW RESULT");
    console.dir(result, {
      depth: 10,
    });
    console.log(
      "========================================",
    );

    const videoUrl =
      normalizeVideoOutput(
        result?.data,
      );

    if (!videoUrl) {
      throw new Error(
        "LTX-2.3 completed but did not return a video URL.",
      );
    }

    return {
      provider: "huggingface",
      model: "Lightricks/LTX-2.3",
      space: SPACE_ID,
      url: videoUrl,
      type: "video",
      duration:
        Number(duration) || 3.5,
      createdAt:
        new Date().toISOString(),
    };
  } catch (error) {
    console.log(
      "========================================",
    );
    console.log(
      "LTX-2.3 VIDEO PROVIDER ERROR",
    );
    console.log(
      "message:",
      error?.message,
    );
    console.log(
      "name:",
      error?.name,
    );
    console.dir(error, {
      depth: 10,
    });
    console.log(
      "========================================",
    );

    throw error;
  }
}

module.exports = {
  generateVideo,
};