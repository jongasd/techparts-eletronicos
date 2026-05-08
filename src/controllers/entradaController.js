const entradaService = require("../services/entradaService");

const entradaController = {
  listarTodas: async (req, res, next) => {
    try {
      const entradas = await entradaService.listarTodas();
      res.json({ sucesso: true, dados: entradas, total: entradas.length });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const entrada = await entradaService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: entrada });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await entradaService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Entrada criada com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await entradaService.atualizar(req.params.id, req.body);
      res.json({ sucesso: true, mensagem: "Entrada atualizada com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  excluir: async (req, res, next) => {
    try {
      await entradaService.excluir(req.params.id);
      res.json({ sucesso: true, mensagem: "Entrada excluída com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = entradaController;
