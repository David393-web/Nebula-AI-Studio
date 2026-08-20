const API_URL = import.meta.env.VITE_IMAGE_API_URL;
const API_KEY = import.meta.env.VITE_IMAGE_API_KEY;

export async function generateAIImage({
  prompt,
  model,
  ratio,
  quality,
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
    }),
  });

  if (!response.ok) {
    throw new Error("Generation failed");
  }

  return await response.json();
}