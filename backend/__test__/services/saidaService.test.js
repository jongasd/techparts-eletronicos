jest.mock("../../src/models/saida");
jest.mock("../../src/models/produtos");
jest.mock("../../src/models/lote");
jest.mock("../../src/config/database");

const Saida = require("../../src/models/saida");
const Produto = require("../../src/models/produtos");
const Lote = require("../../src/models/lote");
const pool = require("../../src/config/database");
const saidaService = require("../../src/services/saidaService");
    

const criarConnMock = () => ({
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
});

describe("saidaService", () => {
  let conn;

  beforeEach(() => {
    conn = criarConnMock();
    pool.getConnection = jest.fn().mockResolvedValue(conn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listarTodas", () => {
    test("delega direto para Saida.findAll", async () => {
      const lista = [{ id_saida: 1 }, { id_saida: 2 }];
      Saida.findAll.mockResolvedValue(lista);

      const resultado = await saidaService.listarTodas();

      expect(Saida.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(lista);
    });
  });

  describe("buscarPorId", () => {
    test("retorna a saída com os itens anexados", async () => {
      const saida = { id_saida: 1, id_cliente: 5 };
      const itens = [{ id_produto: 10, quantidade: 2 }];
      Saida.findById.mockResolvedValue(saida);
      Saida.findItensBySaida.mockResolvedValue(itens);

      const resultado = await saidaService.buscarPorId("1");

      expect(Saida.findById).toHaveBeenCalledWith(1);
      expect(Saida.findItensBySaida).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ ...saida, itens });
    });

    test("rejeita id inválido sem chamar o banco", async () => {
      await expect(saidaService.buscarPorId("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Saida.findById).not.toHaveBeenCalled();
    });

    test("404 quando não encontrada", async () => {
      Saida.findById.mockResolvedValue(null);

      await expect(saidaService.buscarPorId("99")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("criar", () => {
    const itemValido = (overrides = {}) => ({
      id_produto: 10,
      quantidade: 5,
      ...overrides,
    });

    const bodyValido = (overrides = {}) => ({
      id_cliente: 1,
      id_funcionario: 3,
      data_saida: "2026-09-25",
      itens: [itemValido()],
      ...overrides,
    });

    const produtoPadrao = {
      id_produto: 10,
      nome_produto: "Resistor",
      quantidade_estoque: 100,
    };

    test("rejeita quando falta campo obrigatório, sem abrir conexão", async () => {
      const { data_saida, ...semData } = bodyValido();

      await expect(saidaService.criar(semData)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita data_saida inválida", async () => {
      const body = bodyValido({ data_saida: "não é data" });

      await expect(saidaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita id_cliente inválido", async () => {
      const body = bodyValido({ id_cliente: "abc" });

      await expect(saidaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita itens vazio", async () => {
      const body = bodyValido({ itens: [] });

      await expect(saidaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita item sem quantidade", async () => {
      const { quantidade, ...semQuantidade } = itemValido();
      const body = bodyValido({ itens: [semQuantidade] });

      await expect(saidaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita item com quantidade <= 0", async () => {
      const body = bodyValido({ itens: [itemValido({ quantidade: 0 })] });

      await expect(saidaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita quando produto do item não existe, com rollback e release", async () => {
      Saida.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue(null);

      await expect(saidaService.criar(bodyValido())).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
      expect(Produto.decrementarEstoque).not.toHaveBeenCalled();
    });

    test("estoque insuficiente: rejeita antes de criar o item, com rollback", async () => {
      Saida.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue(produtoPadrao);
      Produto.decrementarEstoque.mockResolvedValue(false);

      await expect(saidaService.criar(bodyValido())).rejects.toMatchObject({
        statusCode: 400,
      });

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
      expect(Saida.createItem).not.toHaveBeenCalled();
      expect(Lote.buscarLotesDisponiveisParaAtualizacao).not.toHaveBeenCalled();
    });

    test("consome um único lote suficiente (FIFO)", async () => {
      Saida.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue(produtoPadrao);
      Produto.decrementarEstoque.mockResolvedValue(true);
      Saida.createItem.mockResolvedValue(50);
      Lote.buscarLotesDisponiveisParaAtualizacao.mockResolvedValue([
        { id_lote: 100, quantidade_atual: 20 },
      ]);

      const resultado = await saidaService.criar(bodyValido());

      expect(resultado).toBe(1);
      expect(Lote.abaterQuantidade).toHaveBeenCalledWith(conn, 100, 5);
      expect(Lote.registrarConsumo).toHaveBeenCalledWith(conn, 50, 100, 5);
      expect(conn.commit).toHaveBeenCalledTimes(1);
    });

    test("consome múltiplos lotes em ordem quando o primeiro não é suficiente (FIFO)", async () => {
      const body = bodyValido({ itens: [itemValido({ quantidade: 8 })] });
      Saida.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue(produtoPadrao);
      Produto.decrementarEstoque.mockResolvedValue(true);
      Saida.createItem.mockResolvedValue(50);
      Lote.buscarLotesDisponiveisParaAtualizacao.mockResolvedValue([
        { id_lote: 100, quantidade_atual: 3 },
        { id_lote: 101, quantidade_atual: 10 },
      ]);

      await saidaService.criar(body);

      expect(Lote.abaterQuantidade).toHaveBeenNthCalledWith(1, conn, 100, 3);
      expect(Lote.registrarConsumo).toHaveBeenNthCalledWith(
        1,
        conn,
        50,
        100,
        3,
      );
      expect(Lote.abaterQuantidade).toHaveBeenNthCalledWith(2, conn, 101, 5);
      expect(Lote.registrarConsumo).toHaveBeenNthCalledWith(
        2,
        conn,
        50,
        101,
        5,
      );
    });

    test("inconsistência: estoque agregado ok mas lotes não cobrem a saída", async () => {
      Saida.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue(produtoPadrao);
      Produto.decrementarEstoque.mockResolvedValue(true);
      Saida.createItem.mockResolvedValue(50);
      Lote.buscarLotesDisponiveisParaAtualizacao.mockResolvedValue([
        { id_lote: 100, quantidade_atual: 2 },
      ]);

      await expect(saidaService.criar(bodyValido())).rejects.toMatchObject({
        statusCode: 500,
      });
      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
    });

    test("propaga erro inesperado, com rollback e release", async () => {
      Saida.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue(produtoPadrao);
      Produto.decrementarEstoque.mockRejectedValue(
        new Error("falha de conexão"),
      );

      await expect(saidaService.criar(bodyValido())).rejects.toThrow(
        "falha de conexão",
      );
      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    test("cria saída com sucesso: sequência completa de chamadas", async () => {
      Saida.create.mockResolvedValue(7);
      Produto.findById.mockResolvedValue(produtoPadrao);
      Produto.decrementarEstoque.mockResolvedValue(true);
      Saida.createItem.mockResolvedValue(70);
      Lote.buscarLotesDisponiveisParaAtualizacao.mockResolvedValue([
        { id_lote: 200, quantidade_atual: 50 },
      ]);

      const resultado = await saidaService.criar(bodyValido());

      expect(resultado).toBe(7);
      expect(Saida.create).toHaveBeenCalledWith(
        {
          id_cliente: 1,
          id_funcionario: 3,
          data_saida: "2026-09-25",
          observacao: null,
        },
        conn,
      );
      expect(Produto.decrementarEstoque).toHaveBeenCalledWith(10, 5, conn);
      expect(Saida.createItem).toHaveBeenCalledWith(
        { id_saida: 7, id_produto: 10, quantidade: 5 },
        conn,
      );
      expect(conn.commit).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("atualizar", () => {
    test("404 quando saída não existe", async () => {
      Saida.findById.mockResolvedValue(null);

      await expect(
        saidaService.atualizar("1", { observacao: "teste" }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Saida.update).not.toHaveBeenCalled();
    });

    test("rejeita itens no body sem gravar nada (não mutação parcial)", async () => {
      Saida.findById.mockResolvedValue({ id_saida: 1 });

      await expect(
        saidaService.atualizar("1", {
          observacao: "isso não pode ser salvo",
          itens: [{ id_produto: 10, quantidade: 1 }],
        }),
      ).rejects.toMatchObject({ statusCode: 501 });

      expect(Saida.update).not.toHaveBeenCalled();
    });

    test("rejeita quando nenhum campo válido é enviado", async () => {
      Saida.findById.mockResolvedValue({ id_saida: 1 });

      await expect(saidaService.atualizar("1", {})).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Saida.update).not.toHaveBeenCalled();
    });

    test("rejeita id_cliente inválido", async () => {
      Saida.findById.mockResolvedValue({ id_saida: 1 });

      await expect(
        saidaService.atualizar("1", { id_cliente: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Saida.update).not.toHaveBeenCalled();
    });

    test("rejeita data_saida inválida", async () => {
      Saida.findById.mockResolvedValue({ id_saida: 1 });

      await expect(
        saidaService.atualizar("1", { data_saida: "não é data" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Saida.update).not.toHaveBeenCalled();
    });

    test("atualiza os campos válidos", async () => {
      Saida.findById.mockResolvedValue({ id_saida: 1 });
      Saida.update.mockResolvedValue({ affectedRows: 1 });

      await saidaService.atualizar("1", {
        id_cliente: "2",
        observacao: "  ajuste manual  ",
      });

      expect(Saida.update).toHaveBeenCalledWith(1, {
        id_cliente: 2,
        observacao: "ajuste manual",
      });
    });
  });

  describe("excluir", () => {
    test("rejeita id inválido", async () => {
      await expect(saidaService.excluir("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("sempre retorna 501 pra id válido (exclusão desabilitada)", async () => {
      await expect(saidaService.excluir("1")).rejects.toMatchObject({
        statusCode: 501,
      });
    });
  });
});
