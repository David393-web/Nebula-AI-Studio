const buckets = new Map();

function authRateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip || req.socket?.remoteAddress || "unknown"}:${req.path}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      if (req.path === "/forgot-password" || req.path === "/reset-password") {
        console.warn("Password reset request stopped", { requestStage: "ip_rate_limit", reason: "IP_RATE_LIMITED", retryAfterSeconds, sendAttempted: false });
      }
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ success: false, message: "Too many requests. Please wait and try again." });
    }
    if (buckets.size > 10000) {
      for (const [entry, value] of buckets) if (value.resetAt <= now) buckets.delete(entry);
    }
    next();
  };
}

module.exports = authRateLimit;
