const prisma = require("../utils/prisma");

class ProjectRepository {
  async create({ name, description, status, ownerId }) {
    return prisma.project.create({
      data: {
        name,
        description,
        status,
        ownerId,
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

  async findById(id) {
    return prisma.project.findUnique({
      where: {
        id,
      },
      include: {
        assets: true,
      },
    });
  }

  async update(id, data) {
    return prisma.project.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id) {
    return prisma.project.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = new ProjectRepository();