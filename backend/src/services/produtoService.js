const Produto = require("../models/produtos");
const AppError = require("../utils/appError");
const {
  parseId,
  parseNumero,
  validarCamposObrigatorios,
} = require("../utils/validadores");
const { salvarImagem, removerArquivoImagem } = require("../utils/imagem");

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
  listarTodas: (opcoes = {}) => Produto.findAll(opcoes),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const produto = await Produto.findById(idValido);

    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }

    return produto;
  },

  // arquivo: objeto do multer (req.file) com .buffer, ou undefined.
  criar: async (body, arquivo) => {
    validarCamposObrigatorios(body, CAMPOS_OBRIGATORIOS_CRIACAO);

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

    // Toda a validação dos campos acima já passou: só agora o arquivo vai ao disco.
    if (!arquivo) {
      return await Produto.create(dados);
    }

    const nomeArquivo = await salvarImagem(arquivo.buffer);
    try {
      return await Produto.create({ ...dados, imagem: nomeArquivo });
    } catch (erro) {
      await removerArquivoImagem(nomeArquivo); // não deixa arquivo órfão
      throw erro;
    }
  },

  atualizar: async (id, body, arquivo) => {
    const idValido = parseId(id);

    const produto = await Produto.findById(idValido);
    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }

    const dadosAtualizados = extrairCamposAtualizaveis(body);

    if (Object.keys(dadosAtualizados).length === 0 && !arquivo) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    if (!arquivo) {
      await Produto.update(idValido, dadosAtualizados);
      return;
    }

    const novoNome = await salvarImagem(arquivo.buffer);
    try {
      await Produto.update(idValido, { ...dadosAtualizados, imagem: novoNome });
    } catch (erro) {
      await removerArquivoImagem(novoNome);
      throw erro;
    }
    // só apaga a antiga depois que o banco já aponta para a nova
    await removerArquivoImagem(produto.imagem);
  },

  removerImagem: async (id) => {
    const idValido = parseId(id);

    const produto = await Produto.findById(idValido);
    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }
    if (!produto.imagem) {
      throw new AppError("Produto não possui imagem", 404);
    }

    await Produto.update(idValido, { imagem: null });
    await removerArquivoImagem(produto.imagem);
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
