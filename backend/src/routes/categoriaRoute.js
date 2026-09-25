const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoriaController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get(
  "/",
  autorizar("categorias", "visualizar"),
  categoriaController.listarTodas,
);
router.get(
  "/:id",
  autorizar("categorias", "visualizar"),
  categoriaController.buscarPorId,
);
router.post("/", autorizar("categorias", "criar"), categoriaController.criar);
router.put(
  "/:id",
  autorizar("categorias", "editar"),
  categoriaController.atualizar,
);
router.delete(
  "/:id",
  autorizar("categorias", "excluir"),
  categoriaController.excluir,
);

module.exports = router;
