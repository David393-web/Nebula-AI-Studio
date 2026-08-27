const express = require("express");

const characterController = require("../controllers/CharacterController");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Require authentication for all character routes
router.use(authenticate);

// Create character
router.post("/", characterController.create);

// Get all characters
router.get("/", characterController.getAll);

// Get single character
router.get("/:id", characterController.getOne);

// Update character
router.patch("/:id", characterController.update);

// Delete character
router.delete("/:id", characterController.delete);

module.exports = router;