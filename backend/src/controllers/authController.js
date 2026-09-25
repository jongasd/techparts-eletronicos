const authService = require("../services/authService");

const authController = {
  login: async (req, res, next) => {
    try {
      const { login, senha } = req.body;
      const resultado = await authService.login(login, senha);
      res.json({ sucesso: true, ...resultado });
    } catch (erro) {
      next(erro);
    }
  },

  registrar: async (req, res, next) => {
    try {
      const id = await authService.registrar(req.body);
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
};

module.exports = authController;
