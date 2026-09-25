const express = require("express");
const router = express.Router();
const entradaController = require("../controllers/entradaController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get(
  "/",
  autorizar("entradas", "visualizar"),
  entradaController.listarTodas,
);
router.get(
  "/:id",
  autorizar("entradas", "visualizar"),
  entradaController.buscarPorId,
);
router.post("/", autorizar("entradas", "criar"), entradaController.criar);
router.put(
  "/:id",
  autorizar("entradas", "editar"),
  entradaController.atualizar,
);
router.delete(
  "/:id",
  autorizar("entradas", "excluir"),
  entradaController.excluir,
);

module.exports = router;
