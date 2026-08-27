const storyboardService = require("../services/Storyboard/storyboard.service");

class StoryboardController {
  async create(req, res, next) {
    try {
      const storyboard = await storyboardService.create(
        req.user.userId,
        req.body
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

  async getAll(req, res, next) {
    try {
      const storyboards = await storyboardService.getAll(
        req.user.userId
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

  async getOne(req, res, next) {
    try {
      const storyboard = await storyboardService.getOne(
        req.user.userId,
        req.params.id
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

  async update(req, res, next) {
    try {
      const storyboard = await storyboardService.update(
        req.user.userId,
        req.params.id,
        req.body
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

  async delete(req, res, next) {
    try {
      const result = await storyboardService.delete(
        req.user.userId,
        req.params.id
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoryboardController();