const express = require("express");
const controller = require("../controllers/CreditsController");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();
router.use(authenticate);
router.get("/", controller.summary.bind(controller));
router.get("/costs", controller.costs.bind(controller));
module.exports = router;
