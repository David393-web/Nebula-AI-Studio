const prisma = require("../utils/prisma");

class ProjectRepository {
  // CREATE PROJECT
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

  // GET ALL PROJECTS FOR A USER
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

  // GET ONE PROJECT BY ID
  async findById(id) {
    const cleanId = String(id).trim();

    console.log("🔍 ProjectRepository.findById");
    console.log("   ID:", JSON.stringify(cleanId));
    console.log("   Length:", cleanId.length);

    return prisma.project.findUnique({
      where: {
        id: cleanId,
      },
      include: {
        assets: true,
      },
    });
  }

  // UPDATE PROJECT
  async update(id, data) {
    const cleanId = String(id).trim();

    return prisma.project.update({
      where: {
        id: cleanId,
      },
      data,
    });
  }

  // DELETE PROJECT
  async delete(id) {
    const cleanId = String(id).trim();

    return prisma.project.delete({
      where: {
        id: cleanId,
      },
    });
  }
}

module.exports = new ProjectRepository();