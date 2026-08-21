const prisma = require("../database/postgres");

class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async createUser({ email, passwordHash, name }) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });
  }

  async updateUser(id, data) {
    return prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteUser(id) {
    return prisma.user.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = new UserRepository();