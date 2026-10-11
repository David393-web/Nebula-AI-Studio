const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");
const controller = require("../controllers/AdminEmailController");
const dashboard = require("../controllers/AdminDashboardController");

const router = express.Router();
router.use(authenticate, requireAdmin);
router.get("/dashboard", dashboard.overview.bind(dashboard));
router.get("/users", dashboard.users.bind(dashboard));
router.get("/users/:userId/activity", dashboard.userActivity.bind(dashboard));
router.post("/users/:userId/credits", dashboard.grantCredits.bind(dashboard));
router.get("/activity", dashboard.activity.bind(dashboard));
router.get("/payments", dashboard.payments.bind(dashboard));
router.post("/emails/launch/test", controller.test.bind(controller));
router.post("/emails/launch", controller.launch.bind(controller));

module.exports = router;
