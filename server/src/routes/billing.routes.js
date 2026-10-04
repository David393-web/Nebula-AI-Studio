const express = require("express");
const controller = require("../controllers/BillingController");
const { authenticate } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/webhook", controller.webhook.bind(controller));
router.get("/packages", authenticate, controller.packages.bind(controller));
router.post("/initialize", authenticate, controller.initialize.bind(controller));
router.get("/verify/:reference", authenticate, controller.verify.bind(controller));
router.get("/history", authenticate, controller.history.bind(controller));
module.exports = router;
