const devolucaoService = require("../services/devolucaoService");

const devolucaoController = {
  listarTodas: async (req, res, next) => {
    try {
      const devolucoes = await devolucaoService.listarTodas();
      res.json({ sucesso: true, dados: devolucoes, total: devolucoes.length });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const devolucao = await devolucaoService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: devolucao });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await devolucaoService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Devolução criada com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await devolucaoService.atualizar(req.params.id, req.body);
      res.json({ sucesso: true, mensagem: "Devolução atualizada com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  excluir: async (req, res, next) => {
    try {
      await devolucaoService.excluir(req.params.id);
      res.json({ sucesso: true, mensagem: "Devolução excluída com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = devolucaoController;