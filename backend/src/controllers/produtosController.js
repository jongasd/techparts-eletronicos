const produtoService = require("../services/produtoService");

const produtoController = {
  listarTodas: async (req, res, next) => {
    try {
      const produto = await produtoService.listarTodas();
      res.json({ sucesso: true, dados: produto, total: produto.length });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const produto = await produtoService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: produto });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await produtoService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Produto criado com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await produtoService.atualizar(req.params.id, req.body);
      res.json({ sucesso: true, mensagem: "Produto atualizado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  desativar: async (req, res, next) => {
    try {
      await produtoService.desativar(req.params.id);
      res.json({ sucesso: true, mensagem: "Produto desativado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  // Faltava por completo: service e model já tinham ativar(), mas não
  // existia handler pra expor isso na API.
  ativar: async (req, res, next) => {
    try {
      await produtoService.ativar(req.params.id);
      res.json({ sucesso: true, mensagem: "Produto ativado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = produtoController;
