const express = require("express");
const router = express.Router();
const funcionarioController = require("../controllers/funcionarioController");

router.get("/", funcionarioController.listarTodos);
router.get("/:id", funcionarioController.buscarPorId);
router.post("/", funcionarioController.criar);
router.put("/:id", funcionarioController.atualizar);
router.delete("/:id", funcionarioController.excluir);

module.exports = router;
