  const AppError = require("../utils/appError");


  const errorHandler = (erro, req, res, next) => {
    if (erro instanceof AppError) {
      return res.status(erro.statusCode).json({
        sucesso: false,
        mensagem: erro.message,
      });
    }
    console.error("[Erro interno]", erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno do servidor",
    });
  };

  module.exports = errorHandler;