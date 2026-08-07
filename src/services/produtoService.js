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
  // "ativo" removido de propósito: mudança de status só passa por
  // desativar()/ativar(), que têm validação própria (não deixa desativar
  // duas vezes, etc). Se "ativo" vier no body de um PUT /:id, é ignorado
  // silenciosamente — ver nota abaixo.
];
// Campos que são texto de verdade — os demais são numéricos e não devem
// passar por String().trim(), senão vira "50" em vez de 50 no UPDATE.
const CAMPOS_TEXTO = ["nome_produto", "localizacao"];

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
      dados[campo] === "",
  );
  if (faltando.length > 0) {
    throw new AppError(
      `Campos obrigatórios ausentes: ${faltando.join(", ")}`,
      400,
    );
  }
};

const extrairCamposAtualizaveis = (body) => {
  return CAMPOS_ATUALIZAVEIS.reduce((acc, campo) => {
    if (body[campo] === undefined || body[campo] === "") return acc;

    acc[campo] = CAMPOS_TEXTO.includes(campo)
      ? String(body[campo]).trim()
      : Number(body[campo]);

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
      ativo: Number(body.ativo),
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

  desativar: async (id) => {
    const idValido = parseId(id);
    const produto = await Produto.findById(idValido);
    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }
    if (produto.ativo === 0) {
      throw new AppError("Produto já está desativado", 400);
    }
    await Produto.desativar(idValido);
  },

  ativar: async (id) => {
    const idValido = parseId(id);
    const produto = await Produto.findById(idValido);
    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }
    if (produto.ativo === 1) {
      throw new AppError("Produto já está ativo", 400);
    }
    await Produto.ativar(idValido);
  },
};

module.exports = produtoService;
