const prisma = require("../database/postgres");

class ProjectRepository {
  async create(data) {
    return prisma.project.create({
      data,
    });
  }

  async findById(id) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        assets: true,
      },
    });
  }

  async findByOwner(ownerId) {
    return prisma.project.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(id, data) {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.project.delete({
      where: { id },
    });
  }
}

module.exports = new ProjectRepository();