const prisma = require("../database/postgres");

class VideoRepository {
  async create(data) {
    return prisma.video.create({
      data,
    });
  }

  async findByUser(userId) {
    return prisma.video.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByProject(projectId, userId) {
    return prisma.video.findMany({
      where: {
        projectId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id) {
    return prisma.video.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id, data) {
    return prisma.video.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id) {
    return prisma.video.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = new VideoRepository();