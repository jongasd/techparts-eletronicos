const express = require("express");
const router = express.Router();
const funcionarioController = require("../controllers/funcionarioController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get(
  "/",
  autorizar("funcionarios", "visualizar"),
  funcionarioController.listarTodas,
);
router.get(
  "/:id",
  autorizar("funcionarios", "visualizar"),
  funcionarioController.buscarPorId,
);
router.post(
  "/",
  autorizar("funcionarios", "criar"),
  funcionarioController.criar,
);
router.put(
  "/:id",
  autorizar("funcionarios", "editar"),
  funcionarioController.atualizar,
);
router.delete(
  "/:id",
  autorizar("funcionarios", "excluir"),
  funcionarioController.excluir,
);

module.exports = router;
