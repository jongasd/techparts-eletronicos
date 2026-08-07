const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get(
  "/",
  autorizar("clientes", "visualizar"),
  clienteController.listarTodas,
);
router.get(
  "/:id",
  autorizar("clientes", "visualizar"),
  clienteController.buscarPorId,
);
router.post("/", autorizar("clientes", "criar"), clienteController.criar);
router.put(
  "/:id",
  autorizar("clientes", "editar"),
  clienteController.atualizar,
);
router.delete(
  "/:id",
  autorizar("clientes", "excluir"),
  clienteController.excluir,
);

module.exports = router;
