const pool = require("../config/database"); // mesmo import usado em saidaService
const Devolucao = require("../models/devolucao");
const Produto = require("../models/produtos");
const Saida = require("../models/saida");
const Lote = require("../models/lote");
const AppError = require("../utils/appError");

// ... CAMPOS_OBRIGATORIOS_CRIACAO, parseId, validarCamposObrigatorios,
// validarItens permanecem exatamente como estão ...

const comTransacao = async (fn) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Devolve `quantidade` ao estoque: primeiro aos lotes de origem da saída
 * (do último consumido para o primeiro), e o que não for rastreável cai
 * no lote de ajuste/devolução do produto.
 */
const devolverAosLotes = async (
  conn,
  { id_devolucao, id_saida, id_produto, quantidade },
) => {
  let restante = quantidade;

  const vinculos = await Saida.findLotesDevolviveis(conn, id_saida, id_produto);
  // ordenados por id DESC, com `disponivel` = quantidade - já devolvido, FOR UPDATE

  for (const v of vinculos) {
    if (restante <= 0) break;
    const qtd = Math.min(restante, v.disponivel);
    if (qtd <= 0) continue;

    await Lote.incrementar(conn, v.id_lote, qtd);
    await Devolucao.createLote(
      {
        id_devolucao,
        id_produto,
        id_lote: v.id_lote,
        id_saida_lote: v.id,
        quantidade: qtd,
      },
      conn,
    );
    restante -= qtd;
  }

  if (restante > 0) {
    // venda anterior à migração de lotes (ou sem vínculo): lote explícito de ajuste
    const idLoteAjuste = await Lote.obterOuCriarLoteDevolucao(conn, id_produto);
    await Lote.incrementar(conn, idLoteAjuste, restante);
    await Devolucao.createLote(
      {
        id_devolucao,
        id_produto,
        id_lote: idLoteAjuste,
        id_saida_lote: null,
        quantidade: restante,
      },
      conn,
    );
  }

  await Produto.incrementarEstoque(conn, id_produto, quantidade);
};

const registrarItem = async (conn, { id_devolucao, id_saida, item }) => {
  const id_produto = Number(item.id_produto);
  const quantidade = Number(item.quantidade_devolvida);

  const vendida = await Saida.quantidadeVendida(conn, id_saida, id_produto);
  if (vendida === null) {
    throw new AppError(
      `Produto ${id_produto} não consta na saída ${id_saida}`,
      400,
    );
  }

  const jaDevolvida = await Devolucao.quantidadeJaDevolvida(
    conn,
    id_saida,
    id_produto,
  );
  if (jaDevolvida + quantidade > vendida) {
    throw new AppError(
      `Produto ${id_produto}: devolução excede o vendido (vendido ${vendida}, já devolvido ${jaDevolvida}, solicitado ${quantidade})`,
      400,
    );
  }

  await Devolucao.createItem(
    { id_devolucao, id_produto, quantidade_devolvida: quantidade },
    conn,
  );
  await devolverAosLotes(conn, {
    id_devolucao,
    id_saida,
    id_produto,
    quantidade,
  });
};

/** Desfaz exatamente o que a devolução colocou nos lotes e no estoque agregado. */
const reverterEstoque = async (conn, id_devolucao) => {
  const alocacoes = await Devolucao.findLotesByDevolucao(id_devolucao, conn);
  const porProduto = new Map();

  for (const a of alocacoes) {
    const ok = await Lote.decrementar(conn, a.id_lote, a.quantidade); // false se saldo insuficiente
    if (!ok) {
      throw new AppError(
        "Não é possível alterar/excluir esta devolução: parte do estoque devolvido já foi consumida",
        409,
      );
    }
    porProduto.set(
      a.id_produto,
      (porProduto.get(a.id_produto) || 0) + a.quantidade,
    );
  }

  for (const [id_produto, qtd] of porProduto) {
    await Produto.decrementarEstoque(conn, id_produto, qtd);
  }

  await Devolucao.deleteLotesByDevolucao(id_devolucao, conn);
};

const devolucaoService = {
  listarTodas: () => Devolucao.findAll(),

  buscarPorId: async (id) => {
    /* inalterado */
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

    return comTransacao(async (conn) => {
      const novoId = await Devolucao.create(dadosDevolucao, conn);
      for (const item of body.itens) {
        await registrarItem(conn, {
          id_devolucao: novoId,
          id_saida: dadosDevolucao.id_saida,
          item,
        });
      }
      return novoId;
    });
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

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
    if (body.itens) validarItens(body.itens);

    await comTransacao(async (conn) => {
      const devolucao = await Devolucao.findById(idValido, conn);
      if (!devolucao) throw new AppError("Devolução não encontrada", 404);

      const idSaidaFinal = dadosAtualizados.id_saida ?? devolucao.id_saida;
      const trocouSaida = idSaidaFinal !== devolucao.id_saida;

      // Itens a (re)aplicar: os novos, ou os atuais se a saída mudou (os lotes de origem mudam junto)
      let itensParaAplicar = body.itens ?? null;
      if (!itensParaAplicar && trocouSaida) {
        itensParaAplicar = await Devolucao.findItensByDevolucao(idValido, conn);
      }

      if (itensParaAplicar) {
        await reverterEstoque(conn, idValido);
        await Devolucao.deleteItensByDevolucao(idValido, conn);
      }

      if (Object.keys(dadosAtualizados).length > 0) {
        await Devolucao.update(idValido, dadosAtualizados, conn);
      }

      if (itensParaAplicar) {
        for (const item of itensParaAplicar) {
          await registrarItem(conn, {
            id_devolucao: idValido,
            id_saida: idSaidaFinal,
            item,
          });
        }
      }
    });
  },

  excluir: async (id) => {
    const idValido = parseId(id);

    await comTransacao(async (conn) => {
      const devolucao = await Devolucao.findById(idValido, conn);
      if (!devolucao) throw new AppError("Devolução não encontrada", 404);

      await reverterEstoque(conn, idValido);
      await Devolucao.deleteItensByDevolucao(idValido, conn);
      await Devolucao.delete(idValido, conn);
    });
  },
};

module.exports = devolucaoService;
  