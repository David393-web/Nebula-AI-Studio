const assetService = require("../services/Asset/asset.service");

class AssetController {
  async create(req, res, next) {
    try {
      const {
        name,
        type,
        url,
        thumbnailUrl,
        metadata,
        projectId,
      } = req.body;

      const asset = await assetService.createAsset({
        name,
        type,
        url,
        thumbnailUrl,
        metadata,
        projectId,
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

  async update(req, res, next) {
    try {
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