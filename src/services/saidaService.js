const Saida = require("../models/saida");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = [
  "id_cliente",
  "id_funcionario",
  "data_saida",
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
    throw new AppError("É necessário informar ao menos um item na saída", 400);
  }

  itens.forEach((item, index) => {
    if (!item.id_produto || !item.quantidade) {
      throw new AppError(
        `Item na posição ${index + 1} está incompleto. Campos obrigatórios: id_produto, quantidade`,
        400,
      );
    }
    if (Number(item.quantidade) <= 0) {
      throw new AppError(
        `Item na posição ${index + 1} possui quantidade inválida`,
        400,
      );
    }
  });
};

const saidaService = {
  listarTodas: () => Saida.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const saida = await Saida.findById(idValido);

    if (!saida) {
      throw new AppError("Saída não encontrada", 404);
    }

    const itens = await Saida.findItensBySaida(idValido);
    return { ...saida, itens };
  },

  criar: async (body) => {
    validarCamposObrigatorios(body);
    validarItens(body.itens);

    const dadosSaida = {
      id_cliente: Number(body.id_cliente),
      id_funcionario: Number(body.id_funcionario),
      data_saida: String(body.data_saida),
      observacao: body.observacao ? String(body.observacao).trim() : null,
    };

    const novoId = await Saida.create(dadosSaida);

    for (const item of body.itens) {
      await Saida.createItem({
        id_saida: novoId,
        id_produto: Number(item.id_produto),
        quantidade: Number(item.quantidade),
      });
    }

    return novoId;
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const saida = await Saida.findById(idValido);
    if (!saida) {
      throw new AppError("Saída não encontrada", 404);
    }

    const dadosAtualizados = {};
    if (body.id_cliente !== undefined)
      dadosAtualizados.id_cliente = Number(body.id_cliente);
    if (body.id_funcionario !== undefined)
      dadosAtualizados.id_funcionario = Number(body.id_funcionario);
    if (body.data_saida !== undefined)
      dadosAtualizados.data_saida = String(body.data_saida);
    if (body.observacao !== undefined)
      dadosAtualizados.observacao = body.observacao
        ? String(body.observacao).trim()
        : null;

    if (Object.keys(dadosAtualizados).length === 0 && !body.itens) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    if (Object.keys(dadosAtualizados).length > 0) {
      await Saida.update(idValido, dadosAtualizados);
    }

    if (body.itens) {
      validarItens(body.itens);
      await Saida.deleteItensBySaida(idValido);
      for (const item of body.itens) {
        await Saida.createItem({
          id_saida: idValido,
          id_produto: Number(item.id_produto),
          quantidade: Number(item.quantidade),
        });
      }
    }
  },

  excluir: async (id) => {
    const idValido = parseId(id);

    const saida = await Saida.findById(idValido);
    if (!saida) {
      throw new AppError("Saída não encontrada", 404);
    }

    await Saida.deleteItensBySaida(idValido);
    await Saida.delete(idValido);
  },
};

module.exports = saidaService;
