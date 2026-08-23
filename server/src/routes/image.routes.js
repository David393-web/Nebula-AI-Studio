const express = require("express");

const imageController = require("../controllers/ImageController");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/", imageController.create);

router.get("/", imageController.getAll);

router.get("/:id", imageController.getOne);

router.patch("/:id", imageController.update);

router.delete("/:id", imageController.delete);

module.exports = router;