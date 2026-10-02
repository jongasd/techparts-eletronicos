const express = require("express");
const router = express.Router();
const pdvController = require("../controllers/pdvController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get("/produtos", autorizar("pdv", "vender"), pdvController.buscarProdutos);
router.post("/vendas", autorizar("pdv", "vender"), pdvController.criarVenda);
router.get("/vendas/:id", autorizar("pdv", "visualizar"), pdvController.buscarVenda);

module.exports = router;
