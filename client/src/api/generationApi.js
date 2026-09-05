const API_URL = import.meta.env.VITE_IMAGE_API_URL;
const API_KEY = import.meta.env.VITE_IMAGE_API_KEY;

export async function generateAIImage({
  prompt,
  model,
  ratio,
  quality,
  character = null,
}) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },

    body: JSON.stringify({
      prompt,
      model,
      ratio,
      quality,

      character: character
        ? {
            id: character.id,
            name: character.name,
            description: character.description || "",
            image:
              character.image ||
              character.imageUrl ||
              null,
          }
        : null,
    }),
  });

  if (!response.ok) {
    let message = "Generation failed";

    try {
      const errorData = await response.json();
      message =
        errorData?.message ||
        errorData?.error ||
        message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return await response.json();
}