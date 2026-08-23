const imageRepository = require("./ImageRepository");
const assetRepository = require("./AssetRepository");
const characterRepository = require("./CharacterRepository");

class GalleryRepository {
  async findAllByUser(userId) {
    const [images, assets, characters] = await Promise.all([
      imageRepository.findByUser(userId),
      assetRepository.findByUser(userId),
      characterRepository.findByUser(userId),
    ]);

    return {
      images,
      assets,
      characters,
    };
  }
}

module.exports = new GalleryRepository();