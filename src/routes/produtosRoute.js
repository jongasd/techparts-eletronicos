const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtosController");

router.get("/", produtoController.listarTodas);
router.get("/:id", produtoController.buscarPorId);
router.post("/", produtoController.criar);
router.put("/:id", produtoController.atualizar);
router.delete("/:id", produtoController.excluir);

module.exports = router;
