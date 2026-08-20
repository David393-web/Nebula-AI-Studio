const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function uploadAsset(file) {

  await wait(2000);

  return {

    id: Date.now(),

    name: file.name,

    type: file.type,

    size: file.size,

    url: URL.createObjectURL(file),

    favourite: false,

    createdAt: new Date(),

  };

}