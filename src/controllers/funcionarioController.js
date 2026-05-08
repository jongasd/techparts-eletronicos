const funcionarioService = require("../services/funcionarioService");

const funcionarioController = {
  listarTodos: async (req, res, next) => {
    try {
      const funcionarios = await funcionarioService.listarTodos();
      res.json({
        sucesso: true,
        dados: funcionarios,
        total: funcionarios.length,
      });
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const funcionario = await funcionarioService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: funcionario });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await funcionarioService.criar(req.body);
      res.status(201).json({
        sucesso: true,
        mensagem: "Funcionário criado com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await funcionarioService.atualizar(req.params.id, req.body);
      res.json({
        sucesso: true,
        mensagem: "Funcionário atualizado com sucesso",
      });
    } catch (erro) {
      next(erro);
    }
  },

  excluir: async (req, res, next) => {
    try {
      await funcionarioService.excluir(req.params.id);
      res.json({ sucesso: true, mensagem: "Funcionário excluído com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = funcionarioController;
