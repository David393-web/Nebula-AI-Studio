const getReplicateClient = async () => {
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

const MODEL = "black-forest-labs/flux-2-pro";

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
  resolution = "1 MP",
  outputFormat = "webp",
  outputQuality = 80,
}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("A valid image prompt is required.");
  }

  const replicate = await getReplicateClient();

  const input = {
    prompt: prompt.trim(),
    resolution,
    aspect_ratio: aspectRatio,
    input_images: [],
    output_format: outputFormat,
    output_quality: outputQuality,
    safety_tolerance: 2,
    prompt_upsampling: false,
  };

  const output = await replicate.run(MODEL, {
    input,
  });

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