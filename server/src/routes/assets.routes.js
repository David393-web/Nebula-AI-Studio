const express = require("express");

const assetController = require("../controllers/AssetController");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/", assetController.create);

router.get("/", assetController.getAll);

router.get("/:id", assetController.getOne);

router.patch("/:id", assetController.update);

router.delete("/:id", assetController.delete);

module.exports = router;