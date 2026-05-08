const express = require("express");
const router = express.Router();
const devolucaoController = require("../controllers/devolucaoController");

router.get("/", devolucaoController.listarTodas);
router.get("/:id", devolucaoController.buscarPorId);
router.post("/", devolucaoController.criar);
router.put("/:id", devolucaoController.atualizar);
router.delete("/:id", devolucaoController.excluir);

module.exports = router;