const pool = require("../config/database");
const Saida = require("../models/saida");
const PDV = require("../models/pdv");
const Produto = require("../models/produtos");
const Lote = require("../models/lote");
const AppError = require("../utils/appError");

const FORMAS_PAGAMENTO = ["dinheiro", "pix", "debito", "credito"];

const paraCentavos = (campo, valor, { permitirZero = false } = {}) => {
  const n = Number(valor);
  if (valor === "" || valor === null || !Number.isFinite(n)) {
    throw new AppError(`Campo "${campo}" precisa ser um valor numérico`, 400);
  }
  const centavos = Math.round(n * 100);
  if (Math.abs(n * 100 - centavos) > 1e-6) {
    throw new AppError(`Campo "${campo}" aceita no máximo 2 casas decimais`, 400);
  }
  if (centavos < 0 || (centavos === 0 && !permitirZero)) {
    throw new AppError(`Campo "${campo}" precisa ser maior que zero`, 400);
  }
  return centavos;
};

const deCentavos = (c) => (c / 100).toFixed(2);

const parseIdInteiro = (campo, valor) => {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new AppError(`Campo "${campo}" inválido`, 400);
  }
  return n;
};

const consolidarItens = (itens) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError("A venda precisa ter ao menos um item", 400);
  }
  const mapa = new Map();
  itens.forEach((item, i) => {
    const id = parseIdInteiro(`itens[${i}].id_produto`, item?.id_produto);
    const qtd = Number(item?.quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      throw new AppError(`Item ${i + 1}: quantidade precisa ser inteira e maior que zero`, 400);
    }
    mapa.set(id, (mapa.get(id) ?? 0) + qtd);
  });
  return [...mapa].map(([id_produto, quantidade]) => ({ id_produto, quantidade }));
};

const validarPagamentos = (pagamentos) => {
  if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
    throw new AppError("Informe ao menos uma forma de pagamento", 400);
  }
  return pagamentos.map((p, i) => {
    if (!FORMAS_PAGAMENTO.includes(p?.forma)) {
      throw new AppError(
        `Pagamento ${i + 1}: forma inválida (use: ${FORMAS_PAGAMENTO.join(", ")})`,
        400,
      );
    }
    return { forma: p.forma, centavos: paraCentavos(`pagamentos[${i}].valor`, p.valor) };
  });
};

const dataLocalHoje = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, fuso do servidor

const pdvService = {
  buscarProdutos: async (termo) => {
    const t = String(termo ?? "").trim();
    if (t.length < 2) {
      throw new AppError("Informe ao menos 2 caracteres para buscar", 400);
    }
    return PDV.buscarProdutos(t);
  },

  criarVenda: async (body, funcionario) => {
    if (!funcionario?.id_funcionario) {
      throw new AppError("Funcionário não identificado", 401);
    }

    const itens = consolidarItens(body?.itens);
    const pagamentos = validarPagamentos(body?.pagamentos);
    const descontoCent =
      body?.desconto === undefined || body?.desconto === null
        ? 0
        : paraCentavos("desconto", body.desconto, { permitirZero: true });

    if (descontoCent > 0 && !(funcionario.permissoes || []).includes("pdv:desconto")) {
      throw new AppError("Você não tem permissão para aplicar desconto", 403);
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let idCliente;
      if (body?.id_cliente) {
        idCliente = parseIdInteiro("id_cliente", body.id_cliente);
        if (!(await PDV.clienteAtivo(idCliente, conn))) {
          throw new AppError("Cliente não encontrado ou inativo", 404);
        }
      } else {
        idCliente = await PDV.idConsumidorFinal(conn);
        if (!idCliente) {
          throw new AppError(
            'Cliente "Consumidor final" não cadastrado — rode migrations/002_pdv.sql',
            500,
          );
        }
      }
      let subtotalCent = 0;
      const linhas = [];
      for (const item of itens) {
        const produto = await Produto.findById(item.id_produto, conn);
        if (!produto) {
          throw new AppError(`Produto ${item.id_produto} não encontrado`, 404);
        }
        if (!produto.ativo) {
          throw new AppError(`Produto "${produto.nome_produto}" está inativo`, 400);
        }
        const precoCent = Math.round(Number(produto.preco) * 100);
        if (!(precoCent > 0)) {
          throw new AppError(`Produto "${produto.nome_produto}" está sem preço`, 400);
        }
        subtotalCent += precoCent * item.quantidade;
        linhas.push({ ...item, produto, precoCent });
      }

      if (descontoCent >= subtotalCent) {
        throw new AppError("O desconto precisa ser menor que o subtotal", 400);
      }
      const totalCent = subtotalCent - descontoCent;

      const recebidoCent = pagamentos.reduce((s, p) => s + p.centavos, 0);
      const dinheiroCent = pagamentos
        .filter((p) => p.forma === "dinheiro")
        .reduce((s, p) => s + p.centavos, 0);
      if (recebidoCent < totalCent) {
        throw new AppError(
          `Pagamento insuficiente (total: ${deCentavos(totalCent)}, recebido: ${deCentavos(recebidoCent)})`,
          400,
        );
      }
      const trocoCent = recebidoCent - totalCent;
      if (trocoCent > dinheiroCent) {
        throw new AppError("Pagamentos em pix/cartão não podem exceder o total", 400);
      }

      const idSaida = await Saida.create(
        {
          id_cliente: idCliente,
          id_funcionario: funcionario.id_funcionario,
          data_saida: dataLocalHoje(),
          observacao: body?.observacao ? String(body.observacao).trim() : null,
          origem: "pdv",
          desconto: deCentavos(descontoCent),
          total: deCentavos(totalCent),
          troco: deCentavos(trocoCent),
        },
        conn,
      );

      for (const l of linhas) {
        const ok = await Produto.decrementarEstoque(l.id_produto, l.quantidade, conn);
        if (!ok) {
          throw new AppError(
            `Estoque insuficiente para "${l.produto.nome_produto}" (solicitado: ${l.quantidade})`,
            400,
          );
        }

        const idItemSaida = await Saida.createItem(
          {
            id_saida: idSaida,
            id_produto: l.id_produto,
            quantidade: l.quantidade,
            preco_unitario: deCentavos(l.precoCent),
          },
          conn,
        );

        const lotes = await Lote.buscarLotesDisponiveisParaAtualizacao(conn, l.id_produto);
        let restante = l.quantidade;
        for (const lote of lotes) {
          if (restante <= 0) break;
          const abater = Math.min(lote.quantidade_atual, restante);
          await Lote.abaterQuantidade(conn, lote.id_lote, abater);
          await Lote.registrarConsumo(conn, idItemSaida, lote.id_lote, abater);
          restante -= abater;
        }
        if (restante > 0) {
          throw new AppError(
            `Inconsistência entre estoque e lotes para "${l.produto.nome_produto}"`,
            500,
          );
        }
      }

      let trocoRestante = trocoCent;
      for (const p of pagamentos) {
        let aplicado = p.centavos;
        if (p.forma === "dinheiro" && trocoRestante > 0) {
          const abate = Math.min(aplicado, trocoRestante);
          aplicado -= abate;
          trocoRestante -= abate;
        }
        if (aplicado > 0) {
          await PDV.criarPagamento(
            { id_saida: idSaida, forma: p.forma, valor: deCentavos(aplicado) },
            conn,
          );
        }
      }

      await conn.commit();
      return {
        id_saida: idSaida,
        subtotal: deCentavos(subtotalCent),
        desconto: deCentavos(descontoCent),
        total: deCentavos(totalCent),
        recebido: deCentavos(recebidoCent),
        troco: deCentavos(trocoCent),
      };
    } catch (erro) {
      await conn.rollback();
      throw erro;
    } finally {
      conn.release();
    }
  },

  buscarVenda: async (id) => {
    const idValido = parseIdInteiro("id", id);
    const venda = await Saida.findById(idValido);
    if (!venda || venda.origem !== "pdv") {
      throw new AppError("Venda não encontrada", 404);
    }
    const [itens, pagamentos] = await Promise.all([
      Saida.findItensBySaida(idValido),
      PDV.findPagamentosBySaida(idValido),
    ]);
    return { ...venda, itens, pagamentos };
  },
};

module.exports = pdvService;
