const clienteService = require("../services/clienteService");

const clienteController = {
  listarTodas: async (req, res, next) => {
    try {
      const { pagina, limite, busca } = req.query;
      const resultado = await clienteService.listarTodos({
        pagina,
        limite,
        busca,
      });

      if (resultado && typeof resultado === "object" && !Array.isArray(resultado)) {
        res.json({
          sucesso: true,
          dados: resultado.registros,
          total: resultado.total,
          pagina: resultado.pagina,
          limite: resultado.limite,
          totalPaginas: resultado.totalPaginas,
        });
      } else {
        res.json({ sucesso: true, dados: resultado, total: resultado.length });
      }
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
      res.json({ sucesso: true, mensagem: "Cliente desativado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = clienteController;
