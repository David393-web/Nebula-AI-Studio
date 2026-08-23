const projectService = require("../services/Project/project.service");

class ProjectController {
  async create(req, res, next) {
    try {
      const { name, description } = req.body;

      const project = await projectService.createProject({
        name,
        description,
        ownerId: req.user.userId,
      });

      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: {
          project,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const projects = await projectService.getProjects(
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          projects,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const project = await projectService.getProject(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          project,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const project = await projectService.updateProject(
        req.params.id,
        req.user.userId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: {
          project,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await projectService.deleteProject(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();