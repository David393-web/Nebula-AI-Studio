const storyboardService = require("../services/Storyboard/storyboard.service");

class StoryboardController {
  /*
   * ----------------------------------------
   * Create
   * ----------------------------------------
   */
  async create(req, res, next) {
    try {
      const storyboard =
        await storyboardService.create(
          req.user.id,
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
   * Get All
   * ----------------------------------------
   */
  async getAll(req, res, next) {
    try {
      const storyboards =
        await storyboardService.getAll(
          req.user.id,
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
   * Get By Project
   * ----------------------------------------
   *
   * GET /api/storyboards/project/:projectId
   * ----------------------------------------
   */
  async getByProject(req, res, next) {
    try {
      const { projectId } = req.params;

      const storyboards =
        await storyboardService.getByProject(
          req.user.id,
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
   * Get One
   * ----------------------------------------
   */
  async getOne(req, res, next) {
    try {
      const storyboard =
        await storyboardService.getOne(
          req.user.id,
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
   * Update
   * ----------------------------------------
   */
  async update(req, res, next) {
    try {
      const storyboard =
        await storyboardService.update(
          req.user.id,
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
   * Delete
   * ----------------------------------------
   */
  async delete(req, res, next) {
    try {
      const result =
        await storyboardService.delete(
          req.user.id,
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