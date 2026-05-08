const categoriaService = require("../services/categoriaService");

const categoriaController = {
  listarTodas: async (req, res, next) => {
    try {
      const categorias = await categoriaService.listarTodas();
      res.json({ sucesso: true, dados: categorias, total: categorias.length });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const categoria = await categoriaService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: categoria });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await categoriaService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Categoria criada com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await categoriaService.atualizar(req.params.id, req.body);
      res.json({ sucesso: true, mensagem: "Categoria atualizada com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  excluir: async (req, res, next) => {
    try {
      await categoriaService.excluir(req.params.id);
      res.json({ sucesso: true, mensagem: "Categoria excluída com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = categoriaController;