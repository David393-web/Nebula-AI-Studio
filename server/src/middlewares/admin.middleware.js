const prisma = require("../utils/prisma");

async function requireAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.userId || req.user?.id }, select: { role: true } });
    if (user?.role !== "ADMIN") return res.status(403).json({ success: false, message: "Administrator access is required." });
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireAdmin };
