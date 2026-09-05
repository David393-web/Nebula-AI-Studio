const express = require("express");

const storyboardController = require("../controllers/StoryboardController");

const {
  validateStoryboardCreate,
  validateStoryboardUpdate,
} = require("../validators/storyboard.validator");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

/*
 * ----------------------------------------
 * Authentication
 * ----------------------------------------
 */

router.use(authenticate);

/*
 * ----------------------------------------
 * Create Storyboard
 * POST /api/storyboards
 * ----------------------------------------
 */

router.post(
  "/",
  validateStoryboardCreate,
  storyboardController.create
);

/*
 * ----------------------------------------
 * Get Storyboards For Current User
 * GET /api/storyboards
 * ----------------------------------------
 */

router.get(
  "/",
  storyboardController.getAll
);

/*
 * ----------------------------------------
 * Get Storyboards For A Project
 * GET /api/storyboards/project/:projectId
 *
 * IMPORTANT:
 * This route MUST appear before "/:id".
 * Otherwise "project" can be interpreted
 * as a storyboard ID.
 * ----------------------------------------
 */

router.get(
  "/project/:projectId",
  storyboardController.getByProject
);

/*
 * ----------------------------------------
 * Get Single Storyboard
 * GET /api/storyboards/:id
 * ----------------------------------------
 */

router.get(
  "/:id",
  storyboardController.getOne
);

/*
 * ----------------------------------------
 * Update Storyboard
 * PATCH /api/storyboards/:id
 * ----------------------------------------
 */

router.patch(
  "/:id",
  validateStoryboardUpdate,
  storyboardController.update
);

/*
 * ----------------------------------------
 * Delete Storyboard
 * DELETE /api/storyboards/:id
 * ----------------------------------------
 */

router.delete(
  "/:id",
  storyboardController.delete
);

module.exports = router;