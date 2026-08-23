const express = require("express");

const characterController = require("../controllers/CharacterController");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/", characterController.create);

router.get("/", characterController.getAll);

router.get("/:id", characterController.getOne);

router.patch("/:id", characterController.update);

router.delete("/:id", characterController.delete);

module.exports = router;