const prisma = require("../database/postgres");

class PasswordResetRepository {
  findByUserId(userId) {
    return prisma.passwordReset.findUnique({ where: { userId } });
  }

  findByTokenHash(tokenHash) {
    return prisma.passwordReset.findFirst({ where: { tokenHash } });
  }

  async claimRequest(userId, values, { cooldownBefore, windowBefore, maxRequests }) {
    const current = await this.findByUserId(userId);
    if (!current) {
      try {
        await prisma.passwordReset.create({ data: { userId, ...values, requestCount: 1, windowStartedAt: values.requestedAt } });
        return true;
      } catch (error) {
        if (error?.code === "P2002") return false;
        throw error;
      }
    }

    const windowExpired = current.windowStartedAt <= windowBefore;
    if (current.requestedAt > cooldownBefore || (!windowExpired && current.requestCount >= maxRequests)) return false;
    const changed = await prisma.passwordReset.updateMany({
      where: { id: current.id, requestedAt: current.requestedAt },
      data: {
        ...values,
        requestCount: windowExpired ? 1 : current.requestCount + 1,
        windowStartedAt: windowExpired ? values.requestedAt : current.windowStartedAt,
      },
    });
    return changed.count === 1;
  }

  async consumeAndUpdatePassword({ userId, tokenHash, passwordHash, now }) {
    return prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordReset.updateMany({
        where: { userId, tokenHash, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return false;
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      return true;
    });
  }
}

module.exports = new PasswordResetRepository();
module.exports.PasswordResetRepository = PasswordResetRepository;
