const projectRepository = require("../../repositories/ProjectRepository");

class ProjectService {
  async createProject({ name, description, ownerId }) {
    if (!name || !name.trim()) {
      const error = new Error("Project name is required");
      error.status = 400;
      throw error;
    }

    return projectRepository.create({
      name: name.trim(),
      description: description || null,
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
      const error = new Error("You do not have access to this project");
      error.status = 403;
      throw error;
    }

    return project;
  }

  async updateProject(id, ownerId, data) {
    await this.getProject(id, ownerId);

    return projectRepository.update(id, data);
  }

  async deleteProject(id, ownerId) {
    await this.getProject(id, ownerId);

    await projectRepository.delete(id);
  }
}

module.exports = new ProjectService();