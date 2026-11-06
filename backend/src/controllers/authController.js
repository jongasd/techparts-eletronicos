const authService = require("../services/authService");
const Auditoria = require("../models/auditoria");

const authController = {
  login: async (req, res, next) => {
    try {
      const { login, senha } = req.body;
      const resultado = await authService.login(login, senha);

      // Log de auditoria para login bem-sucedido
      await Auditoria.create({
        id_funcionario: resultado.funcionario.id_funcionario,
        acao: "LOGIN",
        recurso: "auth",
        id_recurso: resultado.funcionario.id_funcionario,
        detalhes: { login },
        ip: req.ip,
      });

      res.json({ sucesso: true, ...resultado });
    } catch (erro) {
      next(erro);
    }
  },

  registrar: async (req, res, next) => {
    try {
      const id = await authService.registrar(req.body);

      // Log de auditoria para criação de novo usuário/role
      await Auditoria.create({
        id_funcionario: req.funcionario?.id_funcionario,
        acao: "CRIAR_FUNCIONARIO_AUTH",
        recurso: "funcionarios",
        id_recurso: id,
        detalhes: {
          nome_funcionario: req.body.nome_funcionario,
          login: req.body.login,
          id_role: req.body.id_role,
        },
        ip: req.ip,
      });

      res
        .status(201)
        .json({
          sucesso: true,
          mensagem: "Funcionário registrado com sucesso",
          id,
        });
    } catch (erro) {
      next(erro);
    }
  },

  trocarSenha: async (req, res, next) => {
    try {
      // req.funcionario é injetado pelo middleware auth
      await authService.trocarSenha(req.funcionario.id_funcionario, req.body);

      await Auditoria.create({
        id_funcionario: req.funcionario.id_funcionario,
        acao: "ALTERAR_SENHA",
        recurso: "auth",
        id_recurso: req.funcionario.id_funcionario,
        ip: req.ip,
      });

      res.json({ sucesso: true, mensagem: "Senha alterada com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = authController;
