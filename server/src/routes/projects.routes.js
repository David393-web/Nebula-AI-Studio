const express = require("express");

const projectController = require("../controllers/ProjectController");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/", projectController.create);

router.get("/", projectController.getAll);

router.get("/:id", projectController.getOne);

router.patch("/:id", projectController.update);

router.delete("/:id", projectController.delete);

module.exports = router;