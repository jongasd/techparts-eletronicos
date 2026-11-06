const Cliente = require("../models/cliente");
const AppError = require("../utils/appError");
const {
  parseId,
  parseAtivo,
  validarCamposObrigatorios,
} = require("../utils/validadores");

const CAMPOS_OBRIGATORIOS_CRIACAO = ["nome_cliente"];

const CAMPOS_ATUALIZAVEIS = ["nome_cliente", "ativo"];

const extrairCamposAtualizaveis = (body) => {
  return CAMPOS_ATUALIZAVEIS.reduce((acc, campo) => {
    if (body[campo] !== undefined && body[campo] !== "") {
      acc[campo] =
        campo === "ativo"
          ? parseAtivo(body[campo])
          : String(body[campo]).trim();
    }
    return acc;
  }, {});
};

const clienteService = {
  listarTodos: (opcoes = {}) => Cliente.findAll(opcoes),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const cliente = await Cliente.findById(idValido);

    if (!cliente) {
      throw new AppError("Cliente não encontrado", 404);
    }

    return cliente;
  },

  criar: async (body) => {
    validarCamposObrigatorios(body, CAMPOS_OBRIGATORIOS_CRIACAO);

    const dados = {
      nome_cliente: String(body.nome_cliente).trim(),
      ativo: body.ativo !== undefined ? parseAtivo(body.ativo) : 1,
    };

    return await Cliente.create(dados);
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const cliente = await Cliente.findById(idValido);
    if (!cliente) {
      throw new AppError("Cliente não encontrado", 404);
    }

    const dadosAtualizados = extrairCamposAtualizaveis(body);

    if (Object.keys(dadosAtualizados).length === 0) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    await Cliente.update(idValido, dadosAtualizados);
  },

  excluir: async (id) => {
    const idValido = parseId(id);
    const cliente = await Cliente.findById(idValido);

    if (!cliente) {
      throw new AppError("Cliente não encontrado", 404);
    }

    if (cliente.ativo === 0) {
      throw new AppError("Cliente já está inativo", 409);
    }

    await Cliente.deactivate(idValido);
  },
};

module.exports = clienteService;
