const galleryRepository = require("../../repositories/GalleryRepository");

class GalleryService {
  async getGallery(userId) {
    if (!userId) {
      const error = new Error("User ID is required");
      error.status = 400;
      throw error;
    }

    const gallery = await galleryRepository.findAllByUser(userId);

    const items = [
      ...gallery.images.map((image) => ({
        ...image,
        galleryType: "IMAGE",
      })),

      ...gallery.assets.map((asset) => ({
        ...asset,
        galleryType: "ASSET",
      })),

      ...gallery.characters.map((character) => ({
        ...character,
        galleryType: "CHARACTER",
      })),
    ];

    // Newest items first
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    return {
      items,
      counts: {
        total: items.length,
        images: gallery.images.length,
        assets: gallery.assets.length,
        characters: gallery.characters.length,
      },
    };
  }

  async getGalleryByType(userId, type) {
    const gallery = await this.getGallery(userId);

    const normalizedType = type.toUpperCase();

    if (!["IMAGE", "ASSET", "CHARACTER"].includes(normalizedType)) {
      const error = new Error(
        "Invalid gallery type. Use IMAGE, ASSET, or CHARACTER"
      );

      error.status = 400;
      throw error;
    }

    const items = gallery.items.filter(
      (item) => item.galleryType === normalizedType
    );

    return {
      items,
      count: items.length,
      type: normalizedType,
    };
  }
}

module.exports = new GalleryService();