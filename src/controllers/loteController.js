const loteService = require("../services/loteService");

const loteController = {
  porProduto: async (req, res, next) => {
    try {
      const lotes = await loteService.listarPorProduto(req.params.id_produto);
      res.json(lotes);
    } catch (erro) {
      next(erro);
    }
  },

  vencendo: async (req, res, next) => {
    try {
      const lotes = await loteService.listarVencendo(req.query.dias);
      res.json(lotes);
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = loteController;
