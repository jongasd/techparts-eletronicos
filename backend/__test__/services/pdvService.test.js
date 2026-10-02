jest.mock("../../src/models/saida");
jest.mock("../../src/models/pdv");
jest.mock("../../src/models/produtos");
jest.mock("../../src/models/lote");
jest.mock("../../src/config/database");

const Saida = require("../../pdv-techparts/src/models/saida");
const PDV = require("../../src/models/pdv");
const Produto = require("../../src/models/produtos");
const Lote = require("../../src/models/lote");
const pool = require("../../src/config/database");
const pdvService = require("../../pdv-techparts/src/services/pdvService");

const criarConnMock = () => ({
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
});

const vendedor = { id_funcionario: 7, permissoes: ["pdv:vender"] };
const gerente = { id_funcionario: 2, permissoes: ["pdv:vender", "pdv:desconto"] };

const produto = (over = {}) => ({
  id_produto: 10,
  nome_produto: "Resistor 10k",
  preco: "10.10",
  ativo: 1,
  quantidade_estoque: 100,
  ...over,
});

describe("pdvService.criarVenda", () => {
  let conn;

  beforeEach(() => {
    conn = criarConnMock();
    pool.getConnection = jest.fn().mockResolvedValue(conn);
    PDV.idConsumidorFinal.mockResolvedValue(1);
    Produto.findById.mockResolvedValue(produto());
    Produto.decrementarEstoque.mockResolvedValue(true);
    Saida.create.mockResolvedValue(55);
    Saida.createItem.mockResolvedValue(900);
    Lote.buscarLotesDisponiveisParaAtualizacao.mockResolvedValue([
      { id_lote: 1, quantidade_atual: 2 },
      { id_lote: 2, quantidade_atual: 50 },
    ]);
  });
  afterEach(() => jest.clearAllMocks());

  test("venda simples em dinheiro com troco: preço vem do banco, vendedor vem do token", async () => {
    const r = await pdvService.criarVenda(
      {
        id_funcionario: 999, // deve ser ignorado
        itens: [{ id_produto: 10, quantidade: 3, preco: "0.01" }], // preço do cliente ignorado
        pagamentos: [{ forma: "dinheiro", valor: 50 }],
      },
      vendedor,
    );

    expect(r).toEqual({
      id_saida: 55,
      subtotal: "30.30",
      desconto: "0.00",
      total: "30.30",
      recebido: "50.00",
      troco: "19.70",
    });
    expect(Saida.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_funcionario: 7, origem: "pdv", total: "30.30", troco: "19.70" }),
      conn,
    );
    expect(Saida.createItem).toHaveBeenCalledWith(
      expect.objectContaining({ preco_unitario: "10.10", quantidade: 3 }),
      conn,
    );
    // pagamento gravado já líquido de troco: 50 - 19.70 = 30.30
    expect(PDV.criarPagamento).toHaveBeenCalledWith(
      { id_saida: 55, forma: "dinheiro", valor: "30.30" },
      conn,
    );
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
  });

  test("consome lotes em ordem e registra o consumo (3 un: 2 do lote 1 + 1 do lote 2)", async () => {
    await pdvService.criarVenda(
      { itens: [{ id_produto: 10, quantidade: 3 }], pagamentos: [{ forma: "pix", valor: 30.3 }] },
      vendedor,
    );
    expect(Lote.abaterQuantidade).toHaveBeenNthCalledWith(1, conn, 1, 2);
    expect(Lote.abaterQuantidade).toHaveBeenNthCalledWith(2, conn, 2, 1);
    expect(Lote.registrarConsumo).toHaveBeenCalledTimes(2);
  });

  test("junta linhas repetidas do mesmo produto", async () => {
    await pdvService.criarVenda(
      {
        itens: [{ id_produto: 10, quantidade: 1 }, { id_produto: 10, quantidade: 2 }],
        pagamentos: [{ forma: "pix", valor: 30.3 }],
      },
      vendedor,
    );
    expect(Saida.createItem).toHaveBeenCalledTimes(1);
    expect(Produto.decrementarEstoque).toHaveBeenCalledWith(10, 3, conn);
  });

  test("pagamento dividido sem troco grava cada parte", async () => {
    await pdvService.criarVenda(
      {
        itens: [{ id_produto: 10, quantidade: 1 }],
        pagamentos: [{ forma: "dinheiro", valor: 5.1 }, { forma: "pix", valor: 5 }],
      },
      vendedor,
    );
    expect(PDV.criarPagamento).toHaveBeenCalledWith({ id_saida: 55, forma: "dinheiro", valor: "5.10" }, conn);
    expect(PDV.criarPagamento).toHaveBeenCalledWith({ id_saida: 55, forma: "pix", valor: "5.00" }, conn);
  });

  test("rejeita pagamento insuficiente e faz rollback", async () => {
    await expect(
      pdvService.criarVenda(
        { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [{ forma: "dinheiro", valor: 10 }] },
        vendedor,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(conn.rollback).toHaveBeenCalled();
    expect(Saida.create).not.toHaveBeenCalled();
  });

  test("pix/cartão acima do total não vira troco", async () => {
    await expect(
      pdvService.criarVenda(
        { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [{ forma: "pix", valor: 20 }] },
        vendedor,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("desconto exige pdv:desconto", async () => {
    const body = {
      itens: [{ id_produto: 10, quantidade: 1 }],
      desconto: 1,
      pagamentos: [{ forma: "dinheiro", valor: 10 }],
    };
    await expect(pdvService.criarVenda(body, vendedor)).rejects.toMatchObject({ statusCode: 403 });
    expect(pool.getConnection).not.toHaveBeenCalled();

    const r = await pdvService.criarVenda(body, gerente);
    expect(r.total).toBe("9.10");
  });

  test("desconto >= subtotal é rejeitado", async () => {
    await expect(
      pdvService.criarVenda(
        {
          itens: [{ id_produto: 10, quantidade: 1 }],
          desconto: 10.1,
          pagamentos: [{ forma: "dinheiro", valor: 10 }],
        },
        gerente,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("produto inativo, estoque insuficiente e lote inconsistente abortam a venda", async () => {
    Produto.findById.mockResolvedValue(produto({ ativo: 0 }));
    await expect(
      pdvService.criarVenda(
        { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [{ forma: "pix", valor: 10.1 }] },
        vendedor,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });

    Produto.findById.mockResolvedValue(produto());
    Produto.decrementarEstoque.mockResolvedValue(false);
    await expect(
      pdvService.criarVenda(
        { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [{ forma: "pix", valor: 10.1 }] },
        vendedor,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });

    Produto.decrementarEstoque.mockResolvedValue(true);
    Lote.buscarLotesDisponiveisParaAtualizacao.mockResolvedValue([]);
    await expect(
      pdvService.criarVenda(
        { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [{ forma: "pix", valor: 10.1 }] },
        vendedor,
      ),
    ).rejects.toMatchObject({ statusCode: 500 });
    expect(conn.commit).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalledTimes(3);
  });

  test("validações de entrada não abrem conexão", async () => {
    const casos = [
      { itens: [], pagamentos: [{ forma: "pix", valor: 1 }] },
      { itens: [{ id_produto: 10, quantidade: 1.5 }], pagamentos: [{ forma: "pix", valor: 1 }] },
      { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [] },
      { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [{ forma: "cheque", valor: 1 }] },
      { itens: [{ id_produto: 10, quantidade: 1 }], pagamentos: [{ forma: "pix", valor: 1.005 }] },
    ];
    for (const c of casos) {
      await expect(pdvService.criarVenda(c, vendedor)).rejects.toMatchObject({ statusCode: 400 });
    }
    expect(pool.getConnection).not.toHaveBeenCalled();
  });
});

describe("pdvService.buscarVenda", () => {
  test("não expõe saída manual como venda do PDV", async () => {
    Saida.findById.mockResolvedValue({ id_saida: 3, origem: "manual" });
    await expect(pdvService.buscarVenda("3")).rejects.toMatchObject({ statusCode: 404 });
  });
});
