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
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByProject(projectId, userId) {
    return prisma.asset.findMany({
      where: {
        projectId,
        userId,
      },
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id) {
    return prisma.asset.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });
  }

  async update(id, data) {
    return prisma.asset.update({
      where: {
        id,
      },
      data,
      include: {
        project: true,
      },
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