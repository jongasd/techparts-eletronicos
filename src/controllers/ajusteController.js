const ajusteService = require("../services/ajusteService");

const ajusteController = {
  listarTodas: async (req, res, next) => {
    try {
      const ajustes = await ajusteService.listarTodas();
      res.json({ sucesso: true, dados: ajustes, total: ajustes.length });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const ajuste = await ajusteService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: ajuste });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await ajusteService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Ajuste criado com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await ajusteService.atualizar(req.params.id, req.body);
      res.json({ sucesso: true, mensagem: "Ajuste atualizado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  excluir: async (req, res, next) => {
    try {
      await ajusteService.excluir(req.params.id);
      res.json({ sucesso: true, mensagem: "Ajuste excluído com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = ajusteController;
