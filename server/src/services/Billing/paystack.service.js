const crypto = require("crypto");
const prisma = require("../../database/postgres");

function packages() {
  try {
    const rows = JSON.parse(process.env.CREDIT_PACKAGES_JSON || "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter((item) => item && /^[a-z0-9_-]{2,40}$/i.test(item.key) && Number.isInteger(item.priceNgn) && item.priceNgn >= 10000 && Number.isInteger(item.credits) && item.credits > 0);
  } catch { return []; }
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY || "";
  if (!key.startsWith("sk_test_")) {
    const error = new Error("Paystack test mode is not configured."); error.status = 503; throw error;
  }
  return key;
}

async function request(endpoint, options = {}) {
  const response = await fetch(`https://api.paystack.co${endpoint}`, {
    ...options,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json();
  if (!response.ok || !payload.status) { const error = new Error("Paystack request failed."); error.status = 502; throw error; }
  return payload.data;
}

async function initialize(user, packageKey) {
  const item = packages().find((row) => row.key === packageKey);
  if (!item) { const error = new Error("This credit package is not available."); error.status = 400; throw error; }
  const reference = `nebula_${crypto.randomUUID().replaceAll("-", "")}`;
  const payment = await prisma.payment.create({ data: {
    userId: user.id, reference, packageKey: item.key, amountMinor: item.priceNgn * 100,
    currency: "NGN", credits: item.credits,
  } });
  try {
    const checkout = await request("/transaction/initialize", { method: "POST", body: JSON.stringify({
      email: user.email, amount: payment.amountMinor, currency: "NGN", reference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: { paymentId: payment.id, userId: user.id, packageKey: item.key },
    }) });
    return { authorizationUrl: checkout.authorization_url, reference };
  } catch (error) {
    await prisma.payment.update({ where: { reference }, data: { status: "failed" } });
    throw error;
  }
}

async function verifyAndCredit(reference, userId = null) {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment || (userId && payment.userId !== userId)) { const error = new Error("Payment was not found."); error.status = 404; throw error; }
  if (payment.status === "success") return { status: "success", alreadyCredited: true };
  const result = await request(`/transaction/verify/${encodeURIComponent(reference)}`);
  const valid = result.status === "success" && result.reference === payment.reference && result.amount === payment.amountMinor && result.currency === "NGN" && result.domain === "test";
  if (!valid) {
    const status = ["failed", "abandoned"].includes(result.status) ? result.status : "pending";
    await prisma.payment.update({ where: { id: payment.id }, data: { status } });
    return { status, alreadyCredited: false };
  }
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({ where: { id: payment.id } });
    if (fresh.status === "success") return;
    await tx.creditAccount.update({ where: { userId: payment.userId }, data: { balance: { increment: payment.credits } } });
    await tx.creditTransaction.create({ data: {
      userId: payment.userId, delta: payment.credits, type: "PURCHASE", reason: `Credit package: ${payment.packageKey}`,
      paymentId: payment.id, idempotencyKey: `payment:${payment.reference}`,
    } });
    await tx.payment.update({ where: { id: payment.id }, data: { status: "success" } });
  });
  return { status: "success", alreadyCredited: false };
}

function validWebhook(rawBody, signature) {
  if (!rawBody || !signature) return false;
  const expected = crypto.createHmac("sha512", secret()).update(rawBody).digest("hex");
  const received = Buffer.from(signature, "hex");
  const calculated = Buffer.from(expected, "hex");
  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
}

module.exports = { packages, initialize, verifyAndCredit, validWebhook };
