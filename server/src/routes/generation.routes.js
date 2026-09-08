const express = require("express");

const generationController = require(
  "../controllers/ImageGenerationController",
);

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post(
  "/image",
  generationController.generate,
);

module.exports = router;