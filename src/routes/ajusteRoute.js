const express = require("express");
const router = express.Router();
const ajusteController = require("../controllers/ajusteController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get(
  "/",
  autorizar("ajustes", "visualizar"),
  ajusteController.listarTodas,
);
router.get(
  "/:id",
  autorizar("ajustes", "visualizar"),
  ajusteController.buscarPorId,
);
router.post("/", autorizar("ajustes", "criar"), ajusteController.criar);
router.put("/:id", autorizar("ajustes", "editar"), ajusteController.atualizar);
router.delete(
  "/:id",
  autorizar("ajustes", "excluir"),
  ajusteController.excluir,
);

module.exports = router;
