const saidaService = require("../services/saidaService");

const saidaController = {
  listarTodas: async (req, res, next) => {
    try {
      const saidas = await saidaService.listarTodas();
      res.json({ sucesso: true, dados: saidas, total: saidas.length });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const saida = await saidaService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: saida });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await saidaService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Saída criada com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await saidaService.atualizar(req.params.id, req.body);
      res.json({ sucesso: true, mensagem: "Saída atualizada com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  excluir: async (req, res, next) => {
    try {
      await saidaService.excluir(req.params.id);
      res.json({ sucesso: true, mensagem: "Saída excluída com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = saidaController;
