import api from "@/services/api";

export async function generateAIImage({
  prompt,
  model,
  ratio,
  quality,
  sceneId,
}) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Image prompt is required.");
  }

  try {
    const response = await api.post("/generation/image", {
      prompt: prompt.trim(),
      model: model || "flux-pro",
      ratio: ratio || "1:1",
      quality: quality || "standard",
      sceneId: sceneId || null,
    });

    const data = response.data?.data || response.data || null;

    if (!data?.url) {
      throw new Error(
        "Image generation completed but no image URL was returned.",
      );
    }

    return {
      id: data.id || null,
      url: data.url,
      type: data.type || "image",
      provider: data.provider || "replicate",
      model: data.model || model || null,
      sceneId: data.sceneId || sceneId || null,
      createdAt: data.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Image generation failed:", error);

    const message =
      error.response?.data?.message ||
      error.message ||
      "Image generation failed.";

    throw new Error(message, {
      cause: error,
    });
  }
}
