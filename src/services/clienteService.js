const Cliente = require("../models/cliente");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = ["nome_cliente"];

const CAMPOS_ATUALIZAVEIS = ["nome_cliente", "ativo"];

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
      acc[campo] =
        campo === "ativo" ? Number(body[campo]) : String(body[campo]).trim();
    }
    return acc;
  }, {});
};

const clienteService = {
  listarTodos: () => Cliente.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const cliente = await Cliente.findById(idValido);

    if (!cliente) {
      throw new AppError("Cliente não encontrado", 404);
    }

    return cliente;
  },

  criar: async (body) => {
    validarCamposObrigatorios(body);

    const dados = {
      nome_cliente: String(body.nome_cliente).trim(),
      ativo: body.ativo !== undefined ? Number(body.ativo) : 1,
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
    const resultado = await Cliente.delete(idValido);

    if (resultado.affectedRows === 0) {
      throw new AppError("Cliente não encontrado", 404);
    }
  },
};

module.exports = clienteService;