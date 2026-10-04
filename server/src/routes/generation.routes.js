const express = require("express");

const generationController = require(
  "../controllers/ImageGenerationController",
);

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const router = express.Router();
const imageOperationController = require("../controllers/ImageOperationController");

router.use(authenticate);

router.post(
  "/image",
  generationController.generate,
);

router.post("/image/process", imageOperationController.process.bind(imageOperationController));

module.exports = router;
