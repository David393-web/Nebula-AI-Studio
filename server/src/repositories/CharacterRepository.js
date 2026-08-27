const prisma = require("../database/postgres");

class CharacterRepository {
  async create(data) {
    return prisma.character.create({
      data,
    });
  }

  async findByUser(userId) {
    return prisma.character.findMany({
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

  async findById(id) {
    return prisma.character.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });
  }

  async update(id, data) {
    return prisma.character.update({
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
    return prisma.character.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = new CharacterRepository();