const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtosController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get(
  "/",
  autorizar("produtos", "visualizar"),
  produtoController.listarTodas,
);
router.get(
  "/:id",
  autorizar("produtos", "visualizar"),
  produtoController.buscarPorId,
);
router.post("/", autorizar("produtos", "criar"), produtoController.criar);
router.put(
  "/:id",
  autorizar("produtos", "editar"),
  produtoController.atualizar,
);
router.put(
  "/:id/desativar",
  autorizar("produtos", "excluir"),
  produtoController.desativar,
);

module.exports = router;
