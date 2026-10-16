const funcionarioService = require("../services/funcionarioService");
const Auditoria = require("../models/auditoria");

const funcionarioController = {
  listarTodas: async (req, res, next) => {
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

      await Auditoria.create({
        id_funcionario: req.funcionario?.id_funcionario,
        acao: "CRIAR_FUNCIONARIO",
        recurso: "funcionarios",
        id_recurso: novoId,
        detalhes: req.body,
        ip: req.ip,
      });

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

      await Auditoria.create({
        id_funcionario: req.funcionario?.id_funcionario,
        acao: "ATUALIZAR_FUNCIONARIO",
        recurso: "funcionarios",
        id_recurso: req.params.id,
        detalhes: req.body,
        ip: req.ip,
      });

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

      await Auditoria.create({
        id_funcionario: req.funcionario?.id_funcionario,
        acao: "DESATIVAR_FUNCIONARIO",
        recurso: "funcionarios",
        id_recurso: req.params.id,
        ip: req.ip,
      });

      res.json({ sucesso: true, mensagem: "Funcionário desativado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = funcionarioController;
