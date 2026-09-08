const express = require("express");

const videoGenerationController = require(
  "../controllers/VideoGenerationController",
);

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post(
  "/video",
  videoGenerationController.generate,
);

module.exports = router;