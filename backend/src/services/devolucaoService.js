const pool = require("../config/database");
const Devolucao = require("../models/devolucao");
const Produto = require("../models/produtos");
const Lote = require("../models/lote");
const AppError = require("../utils/appError");
const distribuirEntreLotes = require("../utils/distribuirEntreLotes");

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
    const qtdAusente =
      item.quantidade_devolvida === undefined ||
      item.quantidade_devolvida === null ||
      item.quantidade_devolvida === "";
    if (!item.id_produto || qtdAusente) {
      throw new AppError(
        `Item na posição ${index + 1} está incompleto. Campos obrigatórios: id_produto, quantidade_devolvida`,
        400,
      );
    }
    const qtd = Number(item.quantidade_devolvida);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      throw new AppError(
        `Item na posição ${index + 1} possui quantidade devolvida inválida`,
        400,
      );
    }
  });
};

const parseIdCampo = (campo, valor) => {
  const parsed = Number(valor);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${campo} inválido`, 400);
  }
  return parsed;
};

// Soma itens repetidos do mesmo produto e ordena por id_produto. A soma faz o
// teto de devolução valer para o total pedido; a ordem fixa evita deadlock
// entre devoluções/vendas que tocam os mesmos produtos em ordens diferentes.
const consolidarItens = (itens) => {
  const mapa = new Map();
  for (const item of itens) {
    const idProduto = Number(item.id_produto);
    mapa.set(
      idProduto,
      (mapa.get(idProduto) ?? 0) + Number(item.quantidade_devolvida),
    );
  }
  return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
};

const linhasParaMapa = (linhas) =>
  new Map(linhas.map((l) => [Number(l.id_produto), Number(l.total)]));

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

    const idSaida = parseIdCampo("id_saida", body.id_saida);
    const idFuncionario = parseIdCampo("id_funcionario", body.id_funcionario);
    const itens = consolidarItens(body.itens);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const saida = await Devolucao.travarSaida(idSaida, conn);
      if (!saida) {
        throw new AppError("Saída não encontrada", 404);
      }

      const vendido = linhasParaMapa(
        await Devolucao.somarVendidoPorProduto(idSaida, conn),
      );
      const devolvido = linhasParaMapa(
        await Devolucao.somarDevolvidoPorProduto(idSaida, conn),
      );

      const novoId = await Devolucao.create(
        {
          id_saida: idSaida,
          id_funcionario: idFuncionario,
          data_devolucao: String(body.data_devolucao),
          motivo: body.motivo ? String(body.motivo).trim() : null,
        },
        conn,
      );

      for (const [idProduto, quantidade] of itens) {
        const totalVendido = vendido.get(idProduto);
        if (!totalVendido) {
          throw new AppError(
            `Produto ${idProduto} não faz parte da saída ${idSaida}`,
            400,
          );
        }

        const jaDevolvido = devolvido.get(idProduto) ?? 0;
        if (quantidade > totalVendido - jaDevolvido) {
          throw new AppError(
            `Quantidade devolvida do produto ${idProduto} excede o saldo devolvível (vendido: ${totalVendido}, já devolvido: ${jaDevolvido}, solicitado: ${quantidade})`,
            409,
          );
        }

        // Devolve aos mesmos lotes de onde a saída tirou (tbl_saida_lote).
        const consumos = await Devolucao.listarConsumoDeLotes(
          idSaida,
          idProduto,
          conn,
        );
        const { alocacoes, naoRastreado } = distribuirEntreLotes(
          consumos,
          jaDevolvido,
          quantidade,
        );
        if (naoRastreado > 0) {
          // Decisão explícita: não inventamos um lote. Estoque agregado e
          // lotes divergiriam e a próxima venda do produto falharia.
          throw new AppError(
            `A saída ${idSaida} não tem lote registrado para o produto ${idProduto} (venda anterior ao controle de lotes). Registre a reposição por uma nova entrada.`,
            409,
          );
        }

        // Mesma ordem de travas da saída (produto, depois lotes).
        await Produto.incrementarEstoque(idProduto, quantidade, conn);
        for (const { id_lote, quantidade: qtdLote } of alocacoes) {
          await Lote.devolverQuantidade(conn, id_lote, qtdLote);
        }

        await Devolucao.createItem(
          {
            id_devolucao: novoId,
            id_produto: idProduto,
            quantidade_devolvida: quantidade,
          },
          conn,
        );
      }

      await conn.commit();
      return novoId;
    } catch (erro) {
      await conn.rollback();
      throw erro;
    } finally {
      conn.release();
    }
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const devolucao = await Devolucao.findById(idValido);
    if (!devolucao) {
      throw new AppError("Devolução não encontrada", 404);
    }

    // Trocar a saída ou os itens exigiria reverter o estoque e os lotes já
    // repostos. Não está implementado: rejeita tudo sem gravar nada.
    if (body.itens !== undefined || body.id_saida !== undefined) {
      throw new AppError(
        "Alterar itens ou saída de uma devolução não é suportado: o estoque e os lotes já foram repostos. Registre uma nova devolução.",
        501,
      );
    }

    const dadosAtualizados = {};
    if (body.id_funcionario !== undefined)
      dadosAtualizados.id_funcionario = parseIdCampo(
        "id_funcionario",
        body.id_funcionario,
      );
    if (body.data_devolucao !== undefined)
      dadosAtualizados.data_devolucao = String(body.data_devolucao);
    if (body.motivo !== undefined)
      dadosAtualizados.motivo = body.motivo ? String(body.motivo).trim() : null;

    if (Object.keys(dadosAtualizados).length === 0) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    await Devolucao.update(idValido, dadosAtualizados);
  },

  excluir: async (id) => {
    parseId(id);
    throw new AppError(
      "Exclusão de devolução não é suportada: ela não reverte o estoque nem os lotes já repostos.",
      501,
    );
  },
};

module.exports = devolucaoService;
