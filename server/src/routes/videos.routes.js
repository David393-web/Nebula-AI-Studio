const express = require("express");

const videoController = require("../controllers/VideoController");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Create video
router.post("/", videoController.create);

// Get all videos
router.get("/", videoController.getAll);

// Get videos belonging to a project
router.get(
  "/project/:projectId",
  videoController.getByProject
);

// Get single video
router.get("/:id", videoController.getOne);

// Update video
router.patch("/:id", videoController.update);

// Delete video
router.delete("/:id", videoController.delete);

module.exports = router;