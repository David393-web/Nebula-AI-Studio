const express = require("express");

const videoGenerationController = require(
  "../controllers/VideoGenerationController",
);

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/video/status/:requestId", videoGenerationController.getStatus);

router.post(
  "/video",
  videoGenerationController.generate,
);

module.exports = router;
