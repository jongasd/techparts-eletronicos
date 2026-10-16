const Funcionario = require("../models/funcionario");
const AppError = require("../utils/appError");
const {
  parseId,
  parseAtivo,
  validarCamposObrigatorios,
} = require("../utils/validadores");

const CAMPOS_OBRIGATORIOS_CRIACAO = ["nome_funcionario"];

const CAMPOS_ATUALIZAVEIS = ["nome_funcionario", "ativo"];

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

const funcionarioService = {
  listarTodos: () => Funcionario.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const funcionario = await Funcionario.findById(idValido);

    if (!funcionario) {
      throw new AppError("Funcionário não encontrado", 404);
    }

    return funcionario;
  },

  criar: async (body) => {
    validarCamposObrigatorios(body, CAMPOS_OBRIGATORIOS_CRIACAO);

    const dados = {
      nome_funcionario: String(body.nome_funcionario).trim(),
      ativo: body.ativo !== undefined ? parseAtivo(body.ativo) : 1,
    };

    return await Funcionario.create(dados);
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const funcionario = await Funcionario.findById(idValido);
    if (!funcionario) {
      throw new AppError("Funcionário não encontrado", 404);
    }

    const dadosAtualizados = extrairCamposAtualizaveis(body);

    if (Object.keys(dadosAtualizados).length === 0) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    await Funcionario.update(idValido, dadosAtualizados);
  },

  excluir: async (id) => {
    const idValido = parseId(id);
    const funcionario = await Funcionario.findById(idValido);

    if (!funcionario) {
      throw new AppError("Funcionário não encontrado", 404);
    }

    if (funcionario.ativo === 0) {
      throw new AppError("Funcionário já está inativo", 409);
    }

    await Funcionario.deactivate(idValido);
  },
};

module.exports = funcionarioService;
