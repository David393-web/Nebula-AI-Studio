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

  async findByGenerationId(generationId, userId) {
    const video = await prisma.video.findUnique({ where: { id: generationId } });
    return video?.userId === userId ? video : null;
  }

  async claimPoll(id, expectedUpdatedAt, metadata) {
    const result = await prisma.video.updateMany({
      where: { id, updatedAt: expectedUpdatedAt },
      data: { metadata },
    });
    return result.count === 1;
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
