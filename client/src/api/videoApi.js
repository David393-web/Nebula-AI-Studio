const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function generateVideo(prompt, settings) {
  console.log(prompt);
  console.log(settings);

  await wait(4000);

  return {
    id: Date.now(),
    prompt,
    settings,
    video:
      "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    createdAt: new Date(),
  };
}