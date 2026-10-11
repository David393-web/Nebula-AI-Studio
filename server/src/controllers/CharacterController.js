const characterService = require("../services/Character/character.service");

const {
  validateCharacterCreate,
  validateCharacterUpdate,
} = require("../validators/character.validator");

class CharacterController {
  // CREATE CHARACTER
  async create(req, res, next) {
    try {
      const body = { ...req.body, imageUrl: req.body.imageUrl ?? req.body.image };
      const { isValid, errors } = validateCharacterCreate(body);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const {
        name,
        description,
        imageUrl,
        metadata,
        projectId,
      } = body;

      const character = await characterService.createCharacter({
        name,
        description,
        imageUrl,
        metadata,
        projectId,
        userId: req.user.userId,
      });

      return res.status(201).json({
        success: true,
        message: "Character created successfully",
        data: {
          character,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET ALL CHARACTERS
  async getAll(req, res, next) {
    try {
      const characters = await characterService.getCharacters(
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          characters,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET SINGLE CHARACTER
  async getOne(req, res, next) {
    try {
      const character = await characterService.getCharacter(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          character,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // UPDATE CHARACTER
  async update(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.imageUrl === undefined && body.image !== undefined) {
        body.imageUrl = body.image;
        delete body.image;
      }
      const { isValid, errors } = validateCharacterUpdate(
        body
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const character = await characterService.updateCharacter(
        req.params.id,
        req.user.userId,
        body
      );

      return res.status(200).json({
        success: true,
        message: "Character updated successfully",
        data: {
          character,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE CHARACTER
  async delete(req, res, next) {
    try {
      await characterService.deleteCharacter(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Character deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CharacterController();
