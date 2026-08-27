const projectRepository = require("../../repositories/ProjectRepository");

class ProjectService {
  async createProject({ name, description, status, ownerId }) {
    if (!name || !name.trim()) {
      const error = new Error("Project name is required");
      error.status = 400;
      throw error;
    }

    return projectRepository.create({
      name: name.trim(),
      description: description || null,
      status,
      ownerId,
    });
  }

  async getProjects(ownerId) {
    return projectRepository.findByOwner(ownerId);
  }

  async getProject(id, ownerId) {
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

  async updateProject(id, ownerId, data) {
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

  async deleteProject(id, ownerId) {
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