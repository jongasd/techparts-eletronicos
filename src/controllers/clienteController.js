const clienteService = require("../services/clienteService");

const clienteController = {
  listarTodas: async (req, res, next) => {
    try {
      const clientes = await clienteService.listarTodas();
      res.json({ sucesso: true, dados: clientes, total: clientes.length });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const cliente = await clienteService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: cliente });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await clienteService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Cliente criado com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await clienteService.atualizar(req.params.id, req.body);
      res.json({ sucesso: true, mensagem: "Cliente atualizado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  excluir: async (req, res, next) => {
    try {
      await clienteService.excluir(req.params.id);
      res.json({ sucesso: true, mensagem: "Cliente excluído com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = clienteController;
