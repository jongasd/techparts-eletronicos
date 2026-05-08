const Produto = require("../models/produtos");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = [
  "id_categoria",
  "nome_produto",
  "quantidade_estoque",
  "quantidade_minima",
  "preco",
  "ativo",
];

const CAMPOS_ATUALIZAVEIS = [
  "id_categoria",
  "nome_produto",
  "quantidade_estoque",
  "quantidade_minima",
  "localizacao",
  "preco",
  "ativo",
];

/**
 * Valida e converte um ID recebido como string/number.
 * @param {*} id
 * @returns {number}
 */
const parseId = (id) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("ID inválido", 400);
  }
  return parsed;
};

/**
 * Garante que todos os campos obrigatórios estão presentes.
 * @param {Object} dados
 */
const validarCamposObrigatorios = (dados) => {
  const faltando = CAMPOS_OBRIGATORIOS_CRIACAO.filter(
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

/**
 * Extrai e sanitiza apenas os campos permitidos para atualização.
 * @param {Object} body
 * @returns {Object}
 */
const extrairCamposAtualizaveis = (body) => {
  return CAMPOS_ATUALIZAVEIS.reduce((acc, campo) => {
    if (body[campo] !== undefined && body[campo] !== "") {
      acc[campo] = String(body[campo]).trim();
    }
    return acc;
  }, {});
};

const produtoService = {
  listarTodas: () => Produto.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const produto = await Produto.findById(idValido);

    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }

    return produto;
  },

  criar: async (body) => {
    validarCamposObrigatorios(body);

    const dados = {
      id_categoria: Number(body.id_categoria),
      nome_produto: String(body.nome_produto),
      quantidade_estoque: Number(body.quantidade_estoque),
      quantidade_minima: Number(body.quantidade_minima),
      localizacao: body.localizacao ? String(body.localizacao).trim() : null,
      preco: Number(body.preco),
      ativo: String(body.ativo).trim(),
    };

    return await Produto.create(dados);
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const produto = await Produto.findById(idValido);
    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }

    const dadosAtualizados = extrairCamposAtualizaveis(body);

    if (Object.keys(dadosAtualizados).length === 0) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    await Produto.update(idValido, dadosAtualizados);
  },

  excluir: async (id) => {
    const idValido = parseId(id);
    const resultado = await Produto.delete(idValido);

    if (resultado.affectedRows === 0) {
      throw new AppError("Produto não encontrado", 404);
    }
  },
};

module.exports = produtoService;
