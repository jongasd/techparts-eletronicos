const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtosController");

router.get("/", produtoController.listarTodas);
router.get("/:id", produtoController.buscarPorId);
router.post("/", produtoController.criar);
router.put("/:id", produtoController.atualizar);
router.put("/:id/desativar", produtoController.desativar);

module.exports = router;