const prisma = require("../database/postgres");

class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: {
        email: String(email || "").trim().toLowerCase(),
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
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: String(email || "").trim().toLowerCase(),
          passwordHash,
          name,
        },
      });
      await tx.creditAccount.create({ data: { userId: user.id, balance: 50 } });
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          delta: 50,
          type: "GRANT",
          reason: "New account welcome credits",
          idempotencyKey: `signup:${user.id}`,
        },
      });
      return user;
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
