const {
  validateProjectCreate,
  validateProjectUpdate,
} = require("../validators/project.validator");

const projectService = require("../services/Project/project.service");

class ProjectController {
  // CREATE PROJECT
  async create(req, res, next) {
    try {
      const { isValid, errors } = validateProjectCreate(req.body);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const { name, description, status } = req.body;

      const project = await projectService.createProject({
        name,
        description,
        status,
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

  // GET ALL PROJECTS
  async getAll(req, res, next) {
    try {
      const projects = await projectService.getProjects(req.user.userId);

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

  // GET ONE PROJECT
  async getOne(req, res, next) {
    try {
      const project = await projectService.getProject(
        req.params.id,
        req.user.userId,
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

  // UPDATE PROJECT
  async update(req, res, next) {
    try {
      const { isValid, errors } = validateProjectUpdate(req.body);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const project = await projectService.updateProject(
        req.params.id,
        req.user.userId,
        req.body,
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

  // DELETE PROJECT
  async delete(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id, req.user.userId);

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
