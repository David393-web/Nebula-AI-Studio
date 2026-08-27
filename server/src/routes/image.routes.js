const express = require("express");

const imageController = require("../controllers/ImageController");

const { authenticate } = require("../middlewares/auth.middleware");

const {
  validateCreateImage,
  validateUpdateImage,
} = require("../validators/image.validator");

const router = express.Router();

// Authentication for all image routes
router.use(authenticate);

// Create image
router.post(
  "/",
  validateCreateImage,
  imageController.create
);

// Get all images for authenticated user
router.get(
  "/",
  imageController.getAll
);

// Get single image
router.get(
  "/:id",
  imageController.getOne
);

// Update image
router.patch(
  "/:id",
  validateUpdateImage,
  imageController.update
);

// Delete image
router.delete(
  "/:id",
  imageController.delete
);

module.exports = router;