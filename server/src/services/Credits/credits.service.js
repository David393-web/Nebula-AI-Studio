const crypto = require("crypto");
const prisma = require("../../database/postgres");

const IMAGE_OPERATION_COSTS = Object.freeze({
  upscale2x: 5, upscale4x: 8, enhance: 8, creativeUpscale: 15,
  faceDetail: 8, edit: 10, removeObject: 8, expand: 10, relight: 8, variation: 5,
});

function creditCost(kind, duration = 0) {
  if (Object.hasOwn(IMAGE_OPERATION_COSTS, kind)) return IMAGE_OPERATION_COSTS[kind];
  if (kind === "image") return Math.max(1, Number(process.env.IMAGE_GENERATION_CREDITS) || 5);
  const perThirty = Math.max(1, Number(process.env.VIDEO_30S_CREDITS) || 40);
  return Math.max(1, Math.ceil(Math.max(2, duration) * perThirty / 30));
}

async function charge(userId, credits, idempotencyKey, reason, generationId = null) {
  if (!idempotencyKey || idempotencyKey.length > 120) {
    const error = new Error("A valid Idempotency-Key header is required."); error.status = 400; throw error;
  }
  return prisma.$transaction(async (tx) => {
    const existing = await tx.creditTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) {
      const error = new Error("This generation request has already been processed."); error.status = 409; throw error;
    }
    const updated = await tx.creditAccount.updateMany({ where: { userId, balance: { gte: credits } }, data: { balance: { decrement: credits } } });
    if (!updated.count) { const error = new Error("Insufficient credits."); error.status = 402; throw error; }
    await tx.creditTransaction.create({ data: { userId, delta: -credits, type: "GENERATION", reason, generationId, idempotencyKey } });
    const account = await tx.creditAccount.findUnique({ where: { userId } });
    return { alreadyCharged: false, balance: account.balance };
  });
}

async function refund(userId, credits, idempotencyKey, reason) {
  return prisma.$transaction(async (tx) => {
    const refundKey = `refund:${idempotencyKey}`;
    if (await tx.creditTransaction.findUnique({ where: { idempotencyKey: refundKey } })) return;
    await tx.creditAccount.update({ where: { userId }, data: { balance: { increment: credits } } });
    await tx.creditTransaction.create({ data: { userId, delta: credits, type: "REFUND", reason, generationId: idempotencyKey, idempotencyKey: refundKey } });
  });
}

async function summary(userId) {
  const [account, transactions] = await Promise.all([
    prisma.creditAccount.findUnique({ where: { userId } }),
    prisma.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return { balance: account?.balance ?? 0, transactions };
}

module.exports = { IMAGE_OPERATION_COSTS, creditCost, charge, refund, summary, newIdempotencyKey: () => crypto.randomUUID() };
