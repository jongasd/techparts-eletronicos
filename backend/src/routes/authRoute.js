const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.post("/login", authController.login);

// Só quem já está logado E tem permissão de gerenciar funcionários
// (por padrão, só Administrador) pode criar novo login.
router.post(
  "/registrar",
  auth,
  autorizar("funcionarios", "criar"),
  authController.registrar,
);

module.exports = router;
