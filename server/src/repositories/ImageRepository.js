const prisma = require("../database/postgres");

class ImageRepository {
  async create(data) {
    return prisma.image.create({
      data,
    });
  }

  async findByUser(userId) {
    return prisma.image.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: true,
      },
    });
  }

  async findById(id) {
    return prisma.image.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });
  }

  async update(id, data) {
    return prisma.image.update({
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
    return prisma.image.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = new ImageRepository();