const express = require("express");

const storageController = require("../controllers/StorageController");

const { authenticate } = require("../middlewares/auth.middleware");

const {
  validateFileUpload,
  validateFileDelete,
} = require("../validators/storage.validator");

const upload = require("../middlewares/upload");

const router = express.Router();

router.use(authenticate);

router.post(
  "/upload",
  upload.single("file"),
  validateFileUpload,
  storageController.upload
);

router.delete(
  "/:fileName",
  validateFileDelete,
  storageController.delete
);

module.exports = router;