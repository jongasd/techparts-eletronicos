const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);
router.use(autorizar("dashboard", "visualizar"));

router.get("/resumo", dashboardController.getResumo);
router.get("/produtos-categoria", dashboardController.getProdutosPorCategoria);
router.get("/movimentacoes", dashboardController.getMovimentacoes7dias);
router.get("/estoque-baixo", dashboardController.getProdutosAbaixoMinimo);

module.exports = router;