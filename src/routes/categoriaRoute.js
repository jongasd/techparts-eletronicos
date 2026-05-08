const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoriaController");

router.get("/", categoriaController.listarTodas);
router.get("/:id", categoriaController.buscarPorId);
router.post("/", categoriaController.criar);
router.put("/:id", categoriaController.atualizar);
router.delete("/:id", categoriaController.excluir);

module.exports = router;