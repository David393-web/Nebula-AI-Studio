const prisma = require("../database/postgres");

class StoryboardRepository {
  async create(data) {
    return prisma.storyboard.create({
      data,
    });
  }

  async findById(id) {
    return prisma.storyboard.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });
  }

  async findByUser(userId) {
    return prisma.storyboard.findMany({
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
    return prisma.storyboard.findMany({
      where: {
        projectId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(id, userId, data) {
    const storyboard = await prisma.storyboard.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!storyboard) {
      const error = new Error("Storyboard not found");
      error.status = 404;
      throw error;
    }

    return prisma.storyboard.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id) {
    return prisma.storyboard.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = new StoryboardRepository();
