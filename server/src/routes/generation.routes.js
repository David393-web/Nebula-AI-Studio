const express = require("express");

const generationController = require(
  "../controllers/ImageGenerationController",
);

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const router = express.Router();
const imageOperationController = require("../controllers/ImageOperationController");
const { getModelRegistry } = require("../services/Generation/modelRegistry");
const { GenerationPresetController } = require("../controllers/GenerationPresetController");
const presetController = new GenerationPresetController();

router.use(authenticate);

router.get("/models", (req, res) => res.json({ success: true, data: { models: getModelRegistry() } }));
router.get("/presets", presetController.list.bind(presetController));
router.post("/presets", presetController.create.bind(presetController));
router.patch("/presets/:id", presetController.update.bind(presetController));
router.delete("/presets/:id", presetController.remove.bind(presetController));

router.post(
  "/image",
  generationController.generate,
);

router.post("/image/process", imageOperationController.process.bind(imageOperationController));

module.exports = router;
