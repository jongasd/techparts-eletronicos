const express = require("express");
const router = express.Router();
const saidaController = require("../controllers/saidaController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get("/", autorizar("saidas", "visualizar"), saidaController.listarTodas);
router.get(
  "/:id",
  autorizar("saidas", "visualizar"),
  saidaController.buscarPorId,
);
router.post("/", autorizar("saidas", "criar"), saidaController.criar);
router.put("/:id", autorizar("saidas", "editar"), saidaController.atualizar);
router.delete("/:id", autorizar("saidas", "excluir"), saidaController.excluir);

module.exports = router;
