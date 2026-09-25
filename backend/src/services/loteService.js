const Lote = require("../models/lote");
const Produto = require("../models/produtos");
const AppError = require("../utils/appError");

const parseId = (id) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("ID inválido", 400);
  }
  return parsed;
};

const loteService = {
  listarPorProduto: async (id_produto) => {
    const idValido = parseId(id_produto);
    const produto = await Produto.findById(idValido);
    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }
    return Lote.listarPorProduto(idValido);
  },

  listarVencendo: async (diasQuery) => {
    const dias = diasQuery === undefined ? 30 : Number(diasQuery);
    if (!Number.isFinite(dias) || dias < 0) {
      throw new AppError("Parâmetro 'dias' inválido", 400);
    }
    return Lote.listarVencendo(dias);
  },
};

module.exports = loteService;
