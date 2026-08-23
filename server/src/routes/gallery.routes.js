const express = require("express");

const galleryController = require("../controllers/GalleryController");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Get complete gallery
router.get(
  "/",
  authenticate,
  galleryController.getAll
);

// Get gallery by type
// IMAGE | ASSET | CHARACTER
router.get(
  "/type/:type",
  authenticate,
  galleryController.getByType
);

module.exports = router;