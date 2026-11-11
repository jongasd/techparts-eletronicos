const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtosController");
const auth = require("../middlewares/auth");
const autorizar = require("../middlewares/autorizar");
const uploadImagem = require("../middlewares/uploadImagem");

router.use(auth);

router.get(
  "/",
  autorizar("produtos", "visualizar"),
  produtoController.listarTodas,
);
router.get(
  "/:id",
  autorizar("produtos", "visualizar"),
  produtoController.buscarPorId,
);
// multipart/form-data com campo opcional "imagem" (JPG/PNG/WebP). JSON puro continua valendo.
// autorizar vem ANTES do upload: quem não tem permissão nem chega a enviar o arquivo.
router.post(
  "/",
  autorizar("produtos", "criar"),
  uploadImagem,
  produtoController.criar,
);
router.put(
  "/:id",
  autorizar("produtos", "editar"),
  uploadImagem,
  produtoController.atualizar,
);
router.delete(
  "/:id/imagem",
  autorizar("produtos", "editar"),
  produtoController.removerImagem,
);
router.put(
  "/:id/desativar",
  autorizar("produtos", "excluir"),
  produtoController.desativar,
);
router.put(
  "/:id/ativar",
  autorizar("produtos", "editar"),
  produtoController.ativar,
);

module.exports = router;
