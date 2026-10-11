const crypto = require("node:crypto");
const prisma = require("../utils/prisma");

const adminUserSelect = { id: true, name: true, email: true };

function daysFromQuery(value) {
  const parsed = Number(value);
  const days = Number.isInteger(parsed) ? parsed : 30;
  return Math.max(1, Math.min(days, 365));
}

class AdminDashboardController {
  async overview(req, res, next) {
    try {
      const days = daysFromQuery(req.query.days);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const [users, newUsers, projects, images, videos, generations, payments, periodPayments, pendingPayments] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.project.count(),
        prisma.image.count(),
        prisma.video.count(),
        prisma.creditTransaction.count({ where: { type: "GENERATION", createdAt: { gte: since } } }),
        prisma.payment.aggregate({ where: { status: "success" }, _sum: { amountMinor: true }, _count: { _all: true } }),
        prisma.payment.aggregate({ where: { status: "success", createdAt: { gte: since } }, _sum: { amountMinor: true }, _count: { _all: true } }),
        prisma.payment.count({ where: { status: "pending" } }),
      ]);

      return res.json({ success: true, data: {
        rangeDays: days,
        users: { total: users, newInRange: newUsers },
        workspace: { projects, images, videos, generationsInRange: generations },
        revenue: {
          currency: "NGN",
          grossAmountMinor: payments._sum.amountMinor || 0,
          successfulPayments: payments._count._all,
          rangeAmountMinor: periodPayments._sum.amountMinor || 0,
          rangePayments: periodPayments._count._all,
          pendingPayments,
          source: "test",
        },
      } });
    } catch (error) { return next(error); }
  }

  async users(req, res, next) {
    try {
      const search = String(req.query.search || "").trim().slice(0, 120);
      const page = Math.max(1, Math.min(Number(req.query.page) || 1, 100000));
      const take = Math.max(1, Math.min(Number(req.query.take) || 25, 100));
      const where = search ? { OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ] } : {};
      const [rows, total] = await Promise.all([
        prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take,
          select: { id: true, name: true, email: true, role: true, createdAt: true, creditAccount: { select: { balance: true } }, _count: { select: { projects: true, images: true, videos: true, creditTransactions: true, payments: true } } },
        }),
        prisma.user.count({ where }),
      ]);
      return res.json({ success: true, data: { users: rows, total, page, pages: Math.ceil(total / take) } });
    } catch (error) { return next(error); }
  }

  async userActivity(req, res, next) {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, createdAt: true, creditAccount: { select: { balance: true } } } });
      if (!user) return res.status(404).json({ success: false, message: "User not found." });
      const [transactions, payments, images, videos, projects] = await Promise.all([
        prisma.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, type: true, delta: true, reason: true, createdAt: true } }),
        prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, packageKey: true, reference: true, amountMinor: true, currency: true, credits: true, status: true, createdAt: true } }),
        prisma.image.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, createdAt: true } }),
        prisma.video.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, createdAt: true } }),
        prisma.project.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, createdAt: true } }),
      ]);
      const activity = [
        ...transactions.map((row) => ({ ...row, event: "credit", label: row.reason })),
        ...payments.map((row) => ({ ...row, event: "payment", label: `${row.packageKey} · ${row.status}` })),
        ...images.map((row) => ({ ...row, event: "image", label: row.name || "Generated image" })),
        ...videos.map((row) => ({ ...row, event: "video", label: row.name || "Generated video" })),
        ...projects.map((row) => ({ ...row, event: "project", label: row.name || "Project created" })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
      return res.json({ success: true, data: { user, activity } });
    } catch (error) { return next(error); }
  }

  async activity(req, res, next) {
    try {
      const take = Math.max(1, Math.min(Number(req.query.take) || 50, 100));
      const [transactions, payments, images, videos, projects] = await Promise.all([
        prisma.creditTransaction.findMany({ orderBy: { createdAt: "desc" }, take, select: { id: true, type: true, delta: true, reason: true, createdAt: true, user: { select: adminUserSelect } } }),
        prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take, select: { id: true, packageKey: true, amountMinor: true, currency: true, status: true, createdAt: true, user: { select: adminUserSelect } } }),
        prisma.image.findMany({ orderBy: { createdAt: "desc" }, take, select: { id: true, name: true, createdAt: true, user: { select: adminUserSelect } } }),
        prisma.video.findMany({ orderBy: { createdAt: "desc" }, take, select: { id: true, name: true, createdAt: true, user: { select: adminUserSelect } } }),
        prisma.project.findMany({ orderBy: { createdAt: "desc" }, take, select: { id: true, name: true, createdAt: true, owner: { select: adminUserSelect } } }),
      ]);
      const events = [
        ...transactions.map((row) => ({ id: row.id, type: "credit", label: row.reason, createdAt: row.createdAt, user: row.user, delta: row.delta, transactionType: row.type })),
        ...payments.map((row) => ({ id: row.id, type: "payment", label: `${row.packageKey} · ${row.status}`, createdAt: row.createdAt, user: row.user, amountMinor: row.amountMinor, currency: row.currency, status: row.status })),
        ...images.map((row) => ({ id: row.id, type: "image", label: row.name || "Image created", createdAt: row.createdAt, user: row.user })),
        ...videos.map((row) => ({ id: row.id, type: "video", label: row.name || "Video created", createdAt: row.createdAt, user: row.user })),
        ...projects.map((row) => ({ id: row.id, type: "project", label: row.name || "Project created", createdAt: row.createdAt, user: row.owner })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, take);
      return res.json({ success: true, data: events });
    } catch (error) { return next(error); }
  }

  async payments(req, res, next) {
    try {
      const take = Math.max(1, Math.min(Number(req.query.take) || 50, 100));
      const payments = await prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take, select: { id: true, packageKey: true, reference: true, amountMinor: true, currency: true, credits: true, status: true, createdAt: true, user: { select: adminUserSelect } } });
      return res.json({ success: true, data: payments });
    } catch (error) { return next(error); }
  }

  async grantCredits(req, res, next) {
    try {
      const { userId } = req.params;
      const amount = Number(req.body?.amount);
      const reason = String(req.body?.reason || "").trim().slice(0, 240);
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000) {
        return res.status(400).json({ success: false, message: "Enter a whole number of credits from 1 to 1,000,000." });
      }
      if (reason.length < 3) return res.status(400).json({ success: false, message: "Add a short reason for this credit grant." });
      const recipient = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
      if (!recipient) return res.status(404).json({ success: false, message: "User not found." });
      const admin = await prisma.user.findUnique({ where: { id: req.user?.userId || req.user?.id }, select: { email: true } });
      const grantId = crypto.randomUUID();
      const result = await prisma.$transaction(async (tx) => {
        const account = await tx.creditAccount.upsert({
          where: { userId },
          create: { userId, balance: amount },
          update: { balance: { increment: amount } },
          select: { balance: true },
        });
        await tx.creditTransaction.create({ data: {
          userId,
          delta: amount,
          type: "GRANT",
          reason: `Admin grant by ${admin?.email || "administrator"}: ${reason}`,
          idempotencyKey: `admin-grant:${grantId}`,
        } });
        return account;
      });
      return res.status(201).json({ success: true, message: `${amount.toLocaleString()} credits added to ${recipient.email}.`, data: { userId, amount, balance: result.balance, grantId } });
    } catch (error) { return next(error); }
  }
}

module.exports = new AdminDashboardController();
