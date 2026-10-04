const credits = require("../services/Credits/credits.service");

class CreditsController {
  async summary(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const data = await credits.summary(userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  costs(req, res) {
    const duration = Math.min(15, Math.max(2, Math.round(Number(req.query.duration) || 5)));
    res.json({ success: true, data: {
      providers: {
        image: { provider: "Replicate", model: process.env.REPLICATE_IMAGE_MODEL || "black-forest-labs/flux-2-pro" },
        video: { provider: "Alibaba Cloud Model Studio", model: process.env.ALIBABA_VIDEO_MODEL || "wan2.6-i2v-flash", fallback: process.env.VIDEO_FALLBACK_PROVIDER || null },
      },
      costs: { image: credits.creditCost("image"), video: credits.creditCost("video", duration), requestedVideoDurationSeconds: duration, maxVideoDurationSeconds: 15 },
      imageOperations: credits.IMAGE_OPERATION_COSTS,
    } });
  }
}

module.exports = new CreditsController();
