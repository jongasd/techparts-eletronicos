const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

const auth = (req, res, next) => {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    return next(new AppError("Token não informado", 401));
  }

  const token = cabecalho.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.funcionario = payload; // { id_funcionario, login, iat, exp }
    next();
  } catch (erro) {
    if (erro.name === "TokenExpiredError") {
      return next(new AppError("Sessão expirada, faça login novamente", 401));
    }
    return next(new AppError("Token inválido", 401));
  }
};

module.exports = auth;
