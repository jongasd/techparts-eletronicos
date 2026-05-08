const Entrada = require("../models/entrada");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = ["id_funcionario", "data_entrada", "itens"];

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

const validarItens = (itens) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError("É necessário informar ao menos um item na entrada", 400);
  }

  itens.forEach((item, index) => {
    if (!item.id_produto || !item.quantidade || !item.valor_unitario) {
      throw new AppError(
        `Item na posição ${index + 1} está incompleto. Campos obrigatórios: id_produto, quantidade, valor_unitario`,
        400
      );
    }
    if (Number(item.quantidade) <= 0) {
      throw new AppError(
        `Item na posição ${index + 1} possui quantidade inválida`,
        400
      );
    }
    if (Number(item.valor_unitario) < 0) {
      throw new AppError(
        `Item na posição ${index + 1} possui valor unitário inválido`,
        400
      );
    }
  });
};

const entradaService = {
  listarTodas: () => Entrada.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const entrada = await Entrada.findById(idValido);

    if (!entrada) {
      throw new AppError("Entrada não encontrada", 404);
    }

    const itens = await Entrada.findItensByEntrada(idValido);
    return { ...entrada, itens };
  },

  criar: async (body) => {
    validarCamposObrigatorios(body);
    validarItens(body.itens);

    const dadosEntrada = {
      id_funcionario: Number(body.id_funcionario),
      data_entrada: String(body.data_entrada),
      observacao: body.observacao ? String(body.observacao).trim() : null,
    };

    const novoId = await Entrada.create(dadosEntrada);

    for (const item of body.itens) {
      await Entrada.createItem({
        id_entrada: novoId,
        id_produto: Number(item.id_produto),
        quantidade: Number(item.quantidade),
        valor_unitario: Number(item.valor_unitario),
      });
    }

    return novoId;
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const entrada = await Entrada.findById(idValido);
    if (!entrada) {
      throw new AppError("Entrada não encontrada", 404);
    }

    const dadosAtualizados = {};
    if (body.id_funcionario !== undefined)
      dadosAtualizados.id_funcionario = Number(body.id_funcionario);
    if (body.data_entrada !== undefined)
      dadosAtualizados.data_entrada = String(body.data_entrada);
    if (body.observacao !== undefined)
      dadosAtualizados.observacao = body.observacao
        ? String(body.observacao).trim()
        : null;

    if (Object.keys(dadosAtualizados).length === 0 && !body.itens) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    if (Object.keys(dadosAtualizados).length > 0) {
      await Entrada.update(idValido, dadosAtualizados);
    }

    if (body.itens) {
      validarItens(body.itens);
      await Entrada.deleteItensByEntrada(idValido);
      for (const item of body.itens) {
        await Entrada.createItem({
          id_entrada: idValido,
          id_produto: Number(item.id_produto),
          quantidade: Number(item.quantidade),
          valor_unitario: Number(item.valor_unitario),
        });
      }
    }
  },

  excluir: async (id) => {
    const idValido = parseId(id);

    const entrada = await Entrada.findById(idValido);
    if (!entrada) {
      throw new AppError("Entrada não encontrada", 404);
    }

    await Entrada.deleteItensByEntrada(idValido);
    await Entrada.delete(idValido);
  },
};

module.exports = entradaService;