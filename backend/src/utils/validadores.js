const AppError = require("./appError");

/**
 * Utilitários centralizados de validação e sanitização (Issue #20).
 * Reduz a duplicação de parseId, parseNumero, parseData, parseAtivo,
 * validarCamposObrigatorios nos services.
 */

const parseId = (id, nomeCampo = "ID") => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${nomeCampo} inválido`, 400);
  }
  return parsed;
};

const parseNumero = (campo, valor) => {
  const numero = Number(valor);
  if (Number.isNaN(numero) || !Number.isFinite(numero)) {
    throw new AppError(`Campo "${campo}" precisa ser um número válido`, 400);
  }
  return numero;
};

const parseData = (campo, valor) => {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    throw new AppError(`Campo "${campo}" precisa ser uma data válida`, 400);
  }
  return String(valor);
};

const parseAtivo = (valor) => {
  const numero = Number(valor);
  if (![0, 1].includes(numero)) {
    throw new AppError('Campo "ativo" precisa ser 0 ou 1', 400);
  }
  return numero;
};

const validarCamposObrigatorios = (dados, camposObrigatorios) => {
  const faltando = camposObrigatorios.filter(
    (campo) =>
      dados[campo] === undefined ||
      dados[campo] === null ||
      dados[campo] === "",
  );
  if (faltando.length > 0) {
    throw new AppError(
      `Campos obrigatórios ausentes: ${faltando.join(", ")}`,
      400,
    );
  }
};

module.exports = {
  parseId,
  parseNumero,
  parseData,
  parseAtivo,
  validarCamposObrigatorios,
};
