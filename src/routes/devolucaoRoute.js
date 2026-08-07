const express = require("express");
const router = express.Router();
const devolucaoController = require("../controllers/devolucaoController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get(
  "/",
  autorizar("devolucoes", "visualizar"),
  devolucaoController.listarTodas,
);
router.get(
  "/:id",
  autorizar("devolucoes", "visualizar"),
  devolucaoController.buscarPorId,
);
router.post("/", autorizar("devolucoes", "criar"), devolucaoController.criar);

module.exports = router;
