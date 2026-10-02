const pdvService = require("../services/pdvService");

const pdvController = {
  buscarProdutos: async (req, res, next) => {
    try {
      const dados = await pdvService.buscarProdutos(req.query.busca);
      res.json({ sucesso: true, dados, total: dados.length });
    } catch (erro) {
      next(erro);
    }
  },

  criarVenda: async (req, res, next) => {
    try {
      const dados = await pdvService.criarVenda(req.body, req.funcionario);
      res.status(201).json({ sucesso: true, mensagem: "Venda registrada", dados });
    } catch (erro) {
      next(erro);
    }
  },

  buscarVenda: async (req, res, next) => {
    try {
      const dados = await pdvService.buscarVenda(req.params.id);
      res.json({ sucesso: true, dados });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = pdvController;
