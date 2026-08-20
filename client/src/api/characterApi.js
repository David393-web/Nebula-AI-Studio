const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function generateCharacter(prompt) {
  await wait(3000);

  return {
  name: `Character ${Date.now()}`,

  avatar: `https://picsum.photos/500?random=${Math.random()}`,

  gender: "Male",

  age: 28,

  ethnicity: "African",

  clothing: "Black Hoodie",

  prompt,
};
}