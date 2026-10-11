const launchEmailService = require("../services/Email/launchEmail.service");

class AdminEmailController {
  async test(req, res, next) {
    try {
      const result = await launchEmailService.sendTest(req.body?.to, req.user?.userId || req.user?.id);
      return res.status(200).json({ success: true, message: "Test launch email accepted by Sendlib.", data: result });
    } catch (error) { return next(error); }
  }

  async launch(req, res, next) {
    try {
      const summary = await launchEmailService.runCampaign();
      return res.status(200).json({ success: true, message: "Launch campaign processing completed.", data: summary });
    } catch (error) { return next(error); }
  }
}

module.exports = new AdminEmailController();
