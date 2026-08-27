const express = require("express");

const storyboardController = require("../controllers/StoryboardController");

const { authenticate } = require("../middlewares/auth.middleware");

const {
  validateStoryboardCreate,
  validateStoryboardUpdate,
} = require("../validators/storyboard.validator");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  validateStoryboardCreate,
  storyboardController.create
);

router.get(
  "/",
  storyboardController.getAll
);

router.get(
  "/:id",
  storyboardController.getOne
);

router.patch(
  "/:id",
  validateStoryboardUpdate,
  storyboardController.update
);

router.delete(
  "/:id",
  storyboardController.delete
);

module.exports = router;