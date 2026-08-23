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
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: true,
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