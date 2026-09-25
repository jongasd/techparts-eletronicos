const express = require("express");
const router = express.Router();
const loteController = require("../controllers/loteController");

// ordem importa: '/vencendo' precisa vir antes de '/produto/:id_produto'
// não colide neste caso (prefixos diferentes), mas mantenha essa ordem se
// adicionar uma rota tipo '/:id' no futuro, senão ela captura '/vencendo' como id.
router.get("/vencendo", loteController.vencendo);
router.get("/produto/:id_produto", loteController.porProduto);

module.exports = router;
