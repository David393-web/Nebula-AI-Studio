const billing = require("../services/Billing/paystack.service");
const prisma = require("../database/postgres");

class BillingController {
  async packages(req, res) {
    res.json({ success: true, data: { currency: "NGN", minimumPriceNgn: 10000, mode: "test", packages: billing.packages() } });
  }
  async initialize(req, res, next) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true } });
      if (!user) return res.status(401).json({ success: false, message: "Authentication required." });
      const result = await billing.initialize(user, req.body?.packageKey);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
  async verify(req, res, next) {
    try {
      const result = await billing.verifyAndCredit(req.params.reference, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
  async history(req, res, next) {
    try {
      const payments = await prisma.payment.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" }, take: 50 });
      res.json({ success: true, data: payments });
    } catch (error) { next(error); }
  }
  async webhook(req, res) {
    try {
      if (!billing.validWebhook(req.rawBody, req.get("x-paystack-signature"))) return res.status(401).json({ success: false });
      const event = req.body;
      if (event?.event === "charge.success" && event?.data?.reference) {
        await billing.verifyAndCredit(event.data.reference);
      }
      return res.sendStatus(200);
    } catch {
      return res.sendStatus(400);
    }
  }
}
module.exports = new BillingController();
