const Produto = require("../models/produtos");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = [
  "id_categoria",
  "nome_produto",
  "quantidade_estoque",
  "quantidade_minima",
  "preco",
];
// "ativo" saiu da lista de obrigatórios: na criação ele tem default (1) e,
// se vier explícito, é validado como 0 ou 1 — ver criar(). Isso evita que
// um POST crie produto já inativo por fora do fluxo de desativar()/ativar(),
// que são os únicos lugares com a validação de "não desativar duas vezes".

const CAMPOS_ATUALIZAVEIS = [
  "id_categoria",
  "nome_produto",
  "quantidade_estoque",
  "quantidade_minima",
  "localizacao",
  "preco",
  // "ativo" removido de propósito: mudança de status só passa por
  // desativar()/ativar(). Se "ativo" vier no body de um PUT /:id, é
  // ignorado silenciosamente.
];

// Campos que são texto de verdade — os demais são numéricos e passam por
// parseNumero, não por String().trim().
const CAMPOS_TEXTO = ["nome_produto", "localizacao"];

const parseId = (id) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("ID inválido", 400);
  }
  return parsed;
};

// Antes: Number(valor) direto, e um preço/quantidade inválido virava NaN
// silenciosamente e ia pro UPDATE/INSERT sem erro nenhum. Agora rejeita.
const parseNumero = (campo, valor) => {
  const numero = Number(valor);
  if (Number.isNaN(numero) || !Number.isFinite(numero)) {
    throw new AppError(`Campo "${campo}" precisa ser um número válido`, 400);
  }
  return numero;
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
    if (
      body[campo] === undefined ||
      body[campo] === "" ||
      body[campo] === null
    ) {
      return acc;
    }

    acc[campo] = CAMPOS_TEXTO.includes(campo)
      ? String(body[campo]).trim()
      : parseNumero(campo, body[campo]);

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

    const ativo = body.ativo === undefined ? 1 : Number(body.ativo);
    if (![0, 1].includes(ativo)) {
      throw new AppError('Campo "ativo" precisa ser 0 ou 1', 400);
    }

    const dados = {
      id_categoria: parseNumero("id_categoria", body.id_categoria),
      nome_produto: String(body.nome_produto).trim(),
      quantidade_estoque: parseNumero(
        "quantidade_estoque",
        body.quantidade_estoque,
      ),
      quantidade_minima: parseNumero(
        "quantidade_minima",
        body.quantidade_minima,
      ),
      localizacao: body.localizacao ? String(body.localizacao).trim() : null,
      preco: parseNumero("preco", body.preco),
      ativo,
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
