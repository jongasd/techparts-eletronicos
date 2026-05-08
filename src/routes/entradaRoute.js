const express = require("express");
const router = express.Router();
const ajusteController = require("../controllers/ajusteController");

router.get("/", ajusteController.listarTodas);
router.get("/:id", ajusteController.buscarPorId);
router.post("/", ajusteController.criar);
router.put("/:id", ajusteController.atualizar);
router.delete("/:id", ajusteController.excluir);

module.exports = router;