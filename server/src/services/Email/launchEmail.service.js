const prisma = require("../../utils/prisma");
const { sendEmail } = require("./sendlib.service");
const { randomUUID } = require("node:crypto");

const CAMPAIGN = "nebula-launch-2026-11-02";
const SUBJECT = "🚀 Nebula AI Studio Launches November 2";
const SENDLIB_REQUEST_GAP_MS = 2100;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);

function launchContent(name = "") {
  const greeting = name.trim() ? `Hello ${name.trim()},` : "Hello,";
  const configuredUrl = process.env.APP_URL || process.env.FRONTEND_URL || (process.env.NODE_ENV !== "production" ? process.env.CLIENT_URL : "");
  const appUrl = String(configuredUrl || "").trim().replace(/\/$/, "");
  let parsedUrl;
  try { parsedUrl = new URL(appUrl); } catch { parsedUrl = null; }
  if (!parsedUrl || !["http:", "https:"].includes(parsedUrl.protocol)) {
    const error = new Error("APP_URL, FRONTEND_URL, or CLIENT_URL must be configured before sending launch email.");
    error.status = 503;
    throw error;
  }
  const text = `${greeting}\n\nThank you for being part of Nebula AI Studio early. We launch on November 2, 2026. Nebula brings AI image and video creation into one creative workspace, where you can create, generate, organize, and build projects.\n\nGet Ready for Launch: ${appUrl}\n\n— The Nebula AI Studio team`;
  const html = `<!doctype html><html><body style="margin:0;background:#08070d;color:#f4f2f8;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:36px 12px;background:#08070d"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid #2b2439;border-radius:20px;background:#111019"><tr><td style="padding:40px 36px"><p style="margin:0 0 12px;color:#b79cff;font-size:12px;letter-spacing:2px;text-transform:uppercase">Nebula AI Studio</p><h1 style="margin:0 0 20px;font-size:32px;line-height:1.2">Your creative workspace launches November 2</h1><p style="font-size:16px;line-height:1.7">${escapeHtml(greeting)}</p><p style="font-size:16px;line-height:1.7">Thank you for being part of Nebula AI Studio early. We’re bringing AI image and video creation into one creative workspace, where you can create, generate, organize, and build projects.</p><p style="margin:30px 0"><a href="${escapeHtml(appUrl)}" style="display:inline-block;border-radius:10px;background:#793cf0;color:#fff;padding:14px 22px;text-decoration:none;font-weight:bold">Get Ready for Launch</a></p><p style="color:#aaa3b7;font-size:13px;line-height:1.6">We look forward to creating with you.<br/>The Nebula AI Studio team</p></td></tr></table></td></tr></table></body></html>`;
  return { subject: SUBJECT, html, text };
}

function isValidEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function sendTest(to, adminUserId) {
  if (!isValidEmail(to)) {
    const error = new Error("Enter a valid test email address."); error.status = 400; throw error;
  }
  if (!adminUserId) { const error = new Error("Administrator context is required."); error.status = 401; throw error; }
  const campaign = `${CAMPAIGN}-test-${randomUUID()}`;
  const entry = await prisma.launchEmailLog.create({ data: { userId: adminUserId, email: to.trim().toLowerCase(), campaign, status: "PENDING" } });
  try {
    const result = await sendEmail({ to: to.trim().toLowerCase(), ...launchContent() });
    await prisma.launchEmailLog.update({ where: { id: entry.id }, data: { status: "SENT", sentAt: new Date(), providerMessageId: result.providerMessageId } });
    return result;
  } catch (error) {
    await prisma.launchEmailLog.update({ where: { id: entry.id }, data: { status: "FAILED", error: String(error.message || "Email test failed").slice(0, 300) } });
    throw error;
  }
}

async function runCampaign() {
  const content = launchContent();
  if (!process.env.SENDLIB_API_KEY || !process.env.SENDLIB_FROM_EMAIL) {
    const error = new Error("Sendlib is not configured."); error.status = 503; throw error;
  }
  await prisma.launchEmailLog.updateMany({ where: { campaign: CAMPAIGN, status: "PENDING", updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } }, data: { status: "FAILED", error: "Previous send worker ended before recording a result." } });
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, settings: { select: { emailNotifications: true } } } });
  const eligible = users.filter((user) => isValidEmail(user.email) && user.settings?.emailNotifications !== false);
  let sent = 0; let failed = 0; let alreadySent = 0; let skipped = 0;
  for (const [userIndex, user] of eligible.entries()) {
    let row;
    try {
      row = await prisma.launchEmailLog.create({ data: { userId: user.id, email: user.email.trim().toLowerCase(), campaign: CAMPAIGN, status: "PENDING" } });
    } catch (error) {
      if (error?.code !== "P2002") throw error;
      row = await prisma.launchEmailLog.findUnique({ where: { userId_campaign: { userId: user.id, campaign: CAMPAIGN } } });
      if (!row || row.status === "SENT") { alreadySent += 1; continue; }
      if (row.status !== "FAILED") { skipped += 1; continue; }
      const claimed = await prisma.launchEmailLog.updateMany({ where: { id: row.id, status: "FAILED" }, data: { status: "PENDING", error: null } });
      if (claimed.count !== 1) { skipped += 1; continue; }
    }
    try {
      const userContent = user.name ? (() => { const personalized = launchContent(user.name); return { ...content, html: personalized.html, text: personalized.text }; })() : content;
      const delivery = await sendEmail({ to: [{ email: user.email.trim().toLowerCase(), name: user.name || undefined }], ...userContent });
      await prisma.launchEmailLog.update({ where: { userId_campaign: { userId: user.id, campaign: CAMPAIGN } }, data: { status: "SENT", sentAt: new Date(), providerMessageId: delivery.providerMessageId, error: null } });
      sent += 1;
    } catch (error) {
      await prisma.launchEmailLog.update({ where: { userId_campaign: { userId: user.id, campaign: CAMPAIGN } }, data: { status: "FAILED", error: String(error.message || "Email send failed").slice(0, 300) } });
      failed += 1;
    }
    if (userIndex < eligible.length - 1) await new Promise((resolve) => setTimeout(resolve, SENDLIB_REQUEST_GAP_MS));
  }
  return { totalEligible: eligible.length, sent, failed, alreadySent, skipped };
}

module.exports = { CAMPAIGN, launchContent, sendTest, runCampaign };
