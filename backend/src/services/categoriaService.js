const Categoria = require("../models/categoria");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = ["nome"];

const CAMPOS_ATUALIZAVEIS = ["nome"];

const parseId = (id) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("ID inválido", 400);
  }
  return parsed;
};

const validarCamposObrigatorios = (dados) => {
  const faltando = CAMPOS_OBRIGATORIOS_CRIACAO.filter(
    (campo) =>
      dados[campo] === undefined ||
      dados[campo] === null ||
      dados[campo] === ""
  );

  if (faltando.length > 0) {
    throw new AppError(
      `Campos obrigatórios ausentes: ${faltando.join(", ")}`,
      400
    );
  }
};

const extrairCamposAtualizaveis = (body) => {
  return CAMPOS_ATUALIZAVEIS.reduce((acc, campo) => {
    if (body[campo] !== undefined && body[campo] !== "") {
      acc[campo] = String(body[campo]).trim();
    }
    return acc;
  }, {});
};

const categoriaService = {
  listarTodas: () => Categoria.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const categoria = await Categoria.findById(idValido);

    if (!categoria) {
      throw new AppError("Categoria não encontrada", 404);
    }

    return categoria;
  },

  criar: async (body) => {
    validarCamposObrigatorios(body);

    const dados = {
      nome: String(body.nome).trim(),
    };

    return await Categoria.create(dados);
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const categoria = await Categoria.findById(idValido);
    if (!categoria) {
      throw new AppError("Categoria não encontrada", 404);
    }

    const dadosAtualizados = extrairCamposAtualizaveis(body);

    if (Object.keys(dadosAtualizados).length === 0) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    await Categoria.update(idValido, dadosAtualizados);
  },

  excluir: async (id) => {
    const idValido = parseId(id);
    const resultado = await Categoria.delete(idValido);

    if (resultado.affectedRows === 0) {
      throw new AppError("Categoria não encontrada", 404);
    }
  },
};

module.exports = categoriaService;