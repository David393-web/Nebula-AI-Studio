const storyboardService = require("../services/Storyboard/storyboard.service");

class StoryboardController {
  /*
   * ----------------------------------------
   * Create Storyboard
   * POST /api/storyboards
   * ----------------------------------------
   */
  async create(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error(
          "Authenticated user could not be identified.",
        );

        error.status = 401;

        throw error;
      }

      const storyboard =
        await storyboardService.create(
          userId,
          req.body,
        );

      return res.status(201).json({
        success: true,
        message: "Storyboard created successfully",
        data: {
          storyboard,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /*
   * ----------------------------------------
   * Get All Storyboards
   * GET /api/storyboards
   * ----------------------------------------
   */
  async getAll(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error(
          "Authenticated user could not be identified.",
        );

        error.status = 401;

        throw error;
      }

      const storyboards =
        await storyboardService.getAll(userId);

      return res.status(200).json({
        success: true,
        data: {
          storyboards,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /*
   * ----------------------------------------
   * Get Storyboards By Project
   * GET /api/storyboards/project/:projectId
   * ----------------------------------------
   */
  async getByProject(req, res, next) {
    try {
      const userId = req.user?.id;
      const { projectId } = req.params;

      if (!userId) {
        const error = new Error(
          "Authenticated user could not be identified.",
        );

        error.status = 401;

        throw error;
      }

      if (!projectId) {
        const error = new Error(
          "Project ID is required.",
        );

        error.status = 400;

        throw error;
      }

      const storyboards =
        await storyboardService.getByProject(
          userId,
          projectId,
        );

      return res.status(200).json({
        success: true,
        data: {
          storyboards,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /*
   * ----------------------------------------
   * Get Single Storyboard
   * GET /api/storyboards/:id
   * ----------------------------------------
   */
  async getOne(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error(
          "Authenticated user could not be identified.",
        );

        error.status = 401;

        throw error;
      }

      const storyboard =
        await storyboardService.getOne(
          userId,
          req.params.id,
        );

      return res.status(200).json({
        success: true,
        data: {
          storyboard,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /*
   * ----------------------------------------
   * Update Storyboard
   * PATCH /api/storyboards/:id
   * ----------------------------------------
   */
  async update(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error(
          "Authenticated user could not be identified.",
        );

        error.status = 401;

        throw error;
      }

      const storyboard =
        await storyboardService.update(
          userId,
          req.params.id,
          req.body,
        );

      return res.status(200).json({
        success: true,
        message: "Storyboard updated successfully",
        data: {
          storyboard,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /*
   * ----------------------------------------
   * Delete Storyboard
   * DELETE /api/storyboards/:id
   * ----------------------------------------
   */
  async delete(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = new Error(
          "Authenticated user could not be identified.",
        );

        error.status = 401;

        throw error;
      }

      const result =
        await storyboardService.delete(
          userId,
          req.params.id,
        );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoryboardController();