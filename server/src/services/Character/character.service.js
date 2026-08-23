const characterRepository = require("../../repositories/CharacterRepository");
const projectRepository = require("../../repositories/ProjectRepository");

class CharacterService {
  async createCharacter({
    name,
    description,
    imageUrl,
    metadata,
    userId,
    projectId,
  }) {
    // Validate name
    if (!name || !name.trim()) {
      const error = new Error("Character name is required");
      error.status = 400;
      throw error;
    }

    // Validate project if provided
    if (projectId) {
      const project = await projectRepository.findById(projectId);

      if (!project) {
        const error = new Error("Project not found");
        error.status = 404;
        throw error;
      }

      // Make sure the logged-in user owns the project
      if (project.ownerId !== userId) {
        const error = new Error(
          "You do not have access to this project"
        );
        error.status = 403;
        throw error;
      }
    }

    return characterRepository.create({
      name: name.trim(),
      description: description?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      metadata: metadata || null,
      userId,
      projectId: projectId || null,
    });
  }

  async getCharacters(userId) {
    return characterRepository.findByUser(userId);
  }

  async getCharacter(id, userId) {
    const character = await characterRepository.findById(id);

    if (!character) {
      const error = new Error("Character not found");
      error.status = 404;
      throw error;
    }

    // Make sure the character belongs to the logged-in user
    if (character.userId !== userId) {
      const error = new Error(
        "You do not have access to this character"
      );
      error.status = 403;
      throw error;
    }

    return character;
  }

  async updateCharacter(id, userId, data) {
    // Verify ownership first
    await this.getCharacter(id, userId);

    const allowedData = {};

    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        const error = new Error("Character name cannot be empty");
        error.status = 400;
        throw error;
      }

      allowedData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      allowedData.description =
        data.description?.trim() || null;
    }

    if (data.imageUrl !== undefined) {
      allowedData.imageUrl =
        data.imageUrl?.trim() || null;
    }

    if (data.metadata !== undefined) {
      allowedData.metadata = data.metadata;
    }

    if (data.projectId !== undefined) {
      if (data.projectId === null || data.projectId === "") {
        allowedData.projectId = null;
      } else {
        const project = await projectRepository.findById(
          data.projectId
        );

        if (!project) {
          const error = new Error("Project not found");
          error.status = 404;
          throw error;
        }

        if (project.ownerId !== userId) {
          const error = new Error(
            "You do not have access to this project"
          );
          error.status = 403;
          throw error;
        }

        allowedData.projectId = data.projectId;
      }
    }

    if (Object.keys(allowedData).length === 0) {
      const error = new Error(
        "No valid fields provided for update"
      );
      error.status = 400;
      throw error;
    }

    return characterRepository.update(id, allowedData);
  }

  async deleteCharacter(id, userId) {
    // Verify ownership first
    await this.getCharacter(id, userId);

    await characterRepository.delete(id);
  }
}

module.exports = new CharacterService();