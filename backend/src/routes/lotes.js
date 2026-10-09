const express = require("express");
const router = express.Router();
const loteController = require("../controllers/loteController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");

router.use(auth);

router.get("/vencendo", autorizar("produtos", "visualizar"), loteController.vencendo);
router.get("/produto/:id_produto",autorizar("produtos", "visualizar"), loteController.porProduto);

module.exports = router;
