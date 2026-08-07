const AppError = require("../utils/appError");

// Uso: router.post("/", auth, autorizar("produtos", "criar"), controller.criar)
const autorizar = (recurso, acao) => (req, res, next) => {
  const permissoes = req.funcionario?.permissoes || [];
  const chave = `${recurso}:${acao}`;

  if (!permissoes.includes(chave)) {
    return next(
      new AppError("Você não tem permissão para realizar esta ação", 403),
    );
  }

  next();
};

module.exports = autorizar;
