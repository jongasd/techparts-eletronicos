const Devolucao = require("../models/devolucao");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = [
  "id_saida",
  "id_funcionario",
  "data_devolucao",
  "itens",
];

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

const validarItens = (itens) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError(
      "É necessário informar ao menos um item na devolução",
      400,
    );
  }

  itens.forEach((item, index) => {
    if (!item.id_produto || !item.quantidade_devolvida) {
      throw new AppError(
        `Item na posição ${index + 1} está incompleto. Campos obrigatórios: id_produto, quantidade_devolvida`,
        400,
      );
    }
    if (Number(item.quantidade_devolvida) <= 0) {
      throw new AppError(
        `Item na posição ${index + 1} possui quantidade devolvida inválida`,
        400,
      );
    }
  });
};

const devolucaoService = {
  listarTodas: () => Devolucao.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const devolucao = await Devolucao.findById(idValido);

    if (!devolucao) {
      throw new AppError("Devolução não encontrada", 404);
    }

    const itens = await Devolucao.findItensByDevolucao(idValido);
    return { ...devolucao, itens };
  },

  criar: async (body) => {
    validarCamposObrigatorios(body);
    validarItens(body.itens);

    const dadosDevolucao = {
      id_saida: Number(body.id_saida),
      id_funcionario: Number(body.id_funcionario),
      data_devolucao: String(body.data_devolucao),
      motivo: body.motivo ? String(body.motivo).trim() : null,
    };

    const novoId = await Devolucao.create(dadosDevolucao);

    for (const item of body.itens) {
      await Devolucao.createItem({
        id_devolucao: novoId,
        id_produto: Number(item.id_produto),
        quantidade_devolvida: Number(item.quantidade_devolvida),
      });
    }

    return novoId;
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const devolucao = await Devolucao.findById(idValido);
    if (!devolucao) {
      throw new AppError("Devolução não encontrada", 404);
    }

    const dadosAtualizados = {};
    if (body.id_saida !== undefined)
      dadosAtualizados.id_saida = Number(body.id_saida);
    if (body.id_funcionario !== undefined)
      dadosAtualizados.id_funcionario = Number(body.id_funcionario);
    if (body.data_devolucao !== undefined)
      dadosAtualizados.data_devolucao = String(body.data_devolucao);
    if (body.motivo !== undefined)
      dadosAtualizados.motivo = body.motivo ? String(body.motivo).trim() : null;

    if (Object.keys(dadosAtualizados).length === 0 && !body.itens) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    if (Object.keys(dadosAtualizados).length > 0) {
      await Devolucao.update(idValido, dadosAtualizados);
    }

    if (body.itens) {
      validarItens(body.itens);
      await Devolucao.deleteItensByDevolucao(idValido);
      for (const item of body.itens) {
        await Devolucao.createItem({
          id_devolucao: idValido,
          id_produto: Number(item.id_produto),
          quantidade_devolvida: Number(item.quantidade_devolvida),
        });
      }
    }
  },

  excluir: async (id) => {
    const idValido = parseId(id);

    const devolucao = await Devolucao.findById(idValido);
    if (!devolucao) {
      throw new AppError("Devolução não encontrada", 404);
    }

    await Devolucao.deleteItensByDevolucao(idValido);
    await Devolucao.delete(idValido);
  },
};

module.exports = devolucaoService;
