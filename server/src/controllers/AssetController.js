const assetService = require("../services/Asset/asset.service");

const {
  validateAssetCreate,
  validateAssetUpdate,
} = require("../validators/asset.validator");

class AssetController {
  // CREATE ASSET
  async create(req, res, next) {
    try {
      const { isValid, errors } = validateAssetCreate(req.body);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const {
        name,
        type,
        url,
        thumbnailUrl,
        metadata,
        projectId,
        isFavorite,
      } = req.body;

      const asset = await assetService.createAsset({
        name,
        type,
        url,
        thumbnailUrl,
        metadata,
        projectId,
        isFavorite,
        userId: req.user.userId,
      });

      return res.status(201).json({
        success: true,
        message: "Asset created successfully",
        data: {
          asset,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET ALL USER ASSETS
  async getAll(req, res, next) {
    try {
      const assets = await assetService.getAssets(
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          assets,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET PROJECT ASSETS
  async getByProject(req, res, next) {
    try {
      const assets = await assetService.getProjectAssets(
        req.params.projectId,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          assets,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET SINGLE ASSET
  async getOne(req, res, next) {
    try {
      const asset = await assetService.getAsset(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        data: {
          asset,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // UPDATE ASSET
  async update(req, res, next) {
    try {
      const { isValid, errors } = validateAssetUpdate(
        req.body
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const asset = await assetService.updateAsset(
        req.params.id,
        req.user.userId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Asset updated successfully",
        data: {
          asset,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE ASSET
  async delete(req, res, next) {
    try {
      await assetService.deleteAsset(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Asset deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetController();