const prisma = require("../database/postgres");

class AssetRepository {
  async create(data) {
    return prisma.asset.create({
      data,
    });
  }

  async findByUser(userId) {
    return prisma.asset.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id) {
    console.log("========== ASSET ID DEBUG ==========");

    console.log("ID FROM URL:", JSON.stringify(id));
    console.log("URL ID LENGTH:", id.length);

    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log("DATABASE ASSETS:");

    assets.forEach((asset) => {
      console.log({
        id: JSON.stringify(asset.id),
        length: asset.id.length,
        name: asset.name,
        exactMatch: asset.id === id,
      });
    });

    const asset = await prisma.asset.findFirst({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });

    console.log("DIRECT LOOKUP:", asset);

    return asset;
  }

  async update(id, data) {
    return prisma.asset.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id) {
    return prisma.asset.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = new AssetRepository();
