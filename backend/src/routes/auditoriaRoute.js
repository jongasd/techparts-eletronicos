const express = require("express");
const router = express.Router();
const auditoriaController = require("../controllers/auditoriaController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

// Apenas quem tem permissão para visualizar funcionários/administração pode ver os logs
router.get(
  "/",
  autorizar("funcionarios", "visualizar"),
  auditoriaController.listarTodas,
);

module.exports = router;
