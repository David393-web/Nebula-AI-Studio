const prisma = require("../database/postgres");

class EmailVerificationRepository {
  findByUserId(userId) {
    return prisma.emailVerification.findUnique({ where: { userId } });
  }

  async createInitial(userId, values) {
    try {
      await prisma.emailVerification.create({ data: { userId, ...values } });
      return true;
    } catch (error) {
      if (error?.code === "P2002") return false;
      throw error;
    }
  }

  async claimResend(record, values, { cooldownBefore, windowBefore, maxResends }) {
    const windowExpired = record.windowStartedAt <= windowBefore;
    const where = {
      id: record.id,
      lastSentAt: { lte: cooldownBefore },
      ...(windowExpired
        ? { windowStartedAt: { lte: windowBefore } }
        : { windowStartedAt: { gt: windowBefore }, resendCount: { lt: maxResends } }),
    };
    const result = await prisma.emailVerification.updateMany({
      where,
      data: {
        ...values,
        resendCount: windowExpired ? 1 : record.resendCount + 1,
        windowStartedAt: windowExpired ? values.lastSentAt : record.windowStartedAt,
      },
    });
    return result.count === 1;
  }

  incrementAttempt(userId, now, maxAttempts) {
    return prisma.emailVerification.updateMany({
      where: { userId, consumedAt: null, expiresAt: { gt: now }, attempts: { lt: maxAttempts } },
      data: { attempts: { increment: 1 } },
    });
  }

  async consumeAndVerify(userId, expectedHash, now, emailVerifiedAt) {
    return prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerification.updateMany({
        where: { userId, codeHash: expectedHash, consumedAt: null, expiresAt: { gt: now }, attempts: { lt: 5 } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return false;
      await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt } });
      return true;
    });
  }
}

module.exports = new EmailVerificationRepository();
module.exports.EmailVerificationRepository = EmailVerificationRepository;
