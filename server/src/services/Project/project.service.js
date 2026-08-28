const projectRepository = require("../../repositories/ProjectRepository");

class ProjectService {
  // CREATE PROJECT
  async createProject({ name, description, status, ownerId }) {
    if (!name || !name.trim()) {
      const error = new Error("Project name is required");
      error.status = 400;
      throw error;
    }

    if (!ownerId) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }

    return projectRepository.create({
      name: name.trim(),
      description: description?.trim() || null,
      status,
      ownerId,
    });
  }

  // GET ALL PROJECTS
  async getProjects(ownerId) {
    if (!ownerId) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }

    return projectRepository.findByOwner(ownerId);
  }

  // GET ONE PROJECT
  async getProject(id, ownerId) {
    if (!id) {
      const error = new Error("Project ID is required");
      error.status = 400;
      throw error;
    }

    if (!ownerId) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }

    const project = await projectRepository.findById(id);

    if (!project) {
      const error = new Error("Project not found");
      error.status = 404;
      throw error;
    }

    if (project.ownerId !== ownerId) {
      const error = new Error("Access denied");
      error.status = 403;
      throw error;
    }

    return project;
  }

  // UPDATE PROJECT
  async updateProject(id, ownerId, data) {
    if (!id) {
      const error = new Error("Project ID is required");
      error.status = 400;
      throw error;
    }

    if (!ownerId) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }

    const project = await projectRepository.findById(id);

    if (!project) {
      const error = new Error("Project not found");
      error.status = 404;
      throw error;
    }

    if (project.ownerId !== ownerId) {
      const error = new Error("Access denied");
      error.status = 403;
      throw error;
    }

    return projectRepository.update(id, data);
  }

  // DELETE PROJECT
  async deleteProject(id, ownerId) {
    if (!id) {
      const error = new Error("Project ID is required");
      error.status = 400;
      throw error;
    }

    if (!ownerId) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }

    const project = await projectRepository.findById(id);

    if (!project) {
      const error = new Error("Project not found");
      error.status = 404;
      throw error;
    }

    if (project.ownerId !== ownerId) {
      const error = new Error("Access denied");
      error.status = 403;
      throw error;
    }

    return projectRepository.delete(id);
  }
}

module.exports = new ProjectService();