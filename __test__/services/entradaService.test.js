jest.mock("../../src/models/entrada");
jest.mock("../../src/models/produtos");
jest.mock("../../src/models/lote");
jest.mock("../../src/config/database");

const Entrada = require("../../src/models/entrada");
const Produto = require("../../src/models/produtos");
const Lote = require("../../src/models/lote");
const pool = require("../../src/config/database");
const entradaService = require("../../src/services/entradaService");

// Ajuste os paths dos require acima (models/config) pra bater com a
// estrutura real do projeto se for diferente.

const criarConnMock = () => ({
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
});

describe("entradaService", () => {
  let conn;

  beforeEach(() => {
    conn = criarConnMock();
    pool.getConnection = jest.fn().mockResolvedValue(conn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listarTodas", () => {
    test("delega direto para Entrada.findAll", async () => {
      const lista = [{ id_entrada: 1 }, { id_entrada: 2 }];
      Entrada.findAll.mockResolvedValue(lista);

      const resultado = await entradaService.listarTodas();

      expect(Entrada.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(lista);
    });
  });

  describe("buscarPorId", () => {
    test("retorna a entrada com os itens anexados", async () => {
      const entrada = { id_entrada: 1, id_funcionario: 3 };
      const itens = [{ id_produto: 10, quantidade: 5 }];
      Entrada.findById.mockResolvedValue(entrada);
      Entrada.findItensByEntrada.mockResolvedValue(itens);

      const resultado = await entradaService.buscarPorId("1");

      expect(Entrada.findById).toHaveBeenCalledWith(1);
      expect(Entrada.findItensByEntrada).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ ...entrada, itens });
    });

    test("rejeita id inválido sem chamar o banco", async () => {
      await expect(entradaService.buscarPorId("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Entrada.findById).not.toHaveBeenCalled();
    });

    test("404 quando não encontrada", async () => {
      Entrada.findById.mockResolvedValue(null);

      await expect(entradaService.buscarPorId("99")).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(Entrada.findItensByEntrada).not.toHaveBeenCalled();
    });
  });

  describe("criar", () => {
    const itemValido = (overrides = {}) => ({
      id_produto: 10,
      quantidade: 5,
      valor_unitario: 2.5,
      ...overrides,
    });

    const bodyValido = (overrides = {}) => ({
      id_funcionario: 3,
      data_entrada: "2026-09-25",
      itens: [itemValido()],
      ...overrides,
    });

    test("rejeita quando falta campo obrigatório, sem abrir conexão", async () => {
      const { data_entrada, ...semData } = bodyValido();

      await expect(entradaService.criar(semData)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita data_entrada inválida", async () => {
      const body = bodyValido({ data_entrada: "não é data" });

      await expect(entradaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita itens vazio", async () => {
      const body = bodyValido({ itens: [] });

      await expect(entradaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita item sem id_produto", async () => {
      const { id_produto, ...semIdProduto } = itemValido();
      const body = bodyValido({ itens: [semIdProduto] });

      await expect(entradaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("rejeita item com quantidade <= 0", async () => {
      const body = bodyValido({ itens: [itemValido({ quantidade: 0 })] });

      await expect(entradaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("rejeita item com valor_unitario negativo", async () => {
      const body = bodyValido({
        itens: [itemValido({ valor_unitario: -1 })],
      });

      await expect(entradaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("rejeita item com data_validade inválida", async () => {
      const body = bodyValido({
        itens: [itemValido({ data_validade: "não é data" })],
      });

      await expect(entradaService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("aceita item com valor_unitario igual a 0 (bonificado)", async () => {
      const body = bodyValido({
        itens: [itemValido({ valor_unitario: 0 })],
      });
      Entrada.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue({ id_produto: 10 });
      Entrada.createItem.mockResolvedValue(100);

      await expect(entradaService.criar(body)).resolves.toBe(1);
    });

    test("rejeita quando produto do item não existe, com rollback e release", async () => {
      const body = bodyValido();
      Entrada.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue(null);

      await expect(entradaService.criar(body)).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
      expect(Entrada.createItem).not.toHaveBeenCalled();
      expect(Produto.incrementarEstoque).not.toHaveBeenCalled();
      expect(Lote.criar).not.toHaveBeenCalled();
    });

    test("propaga erro inesperado no meio da transação, com rollback e release", async () => {
      const body = bodyValido();
      Entrada.create.mockResolvedValue(1);
      Produto.findById.mockResolvedValue({ id_produto: 10 });
      Entrada.createItem.mockRejectedValue(new Error("falha de conexão"));

      await expect(entradaService.criar(body)).rejects.toThrow(
        "falha de conexão",
      );

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    test("cria entrada com um item: sequência completa de chamadas", async () => {
      const body = bodyValido();
      Entrada.create.mockResolvedValue(7);
      Produto.findById.mockResolvedValue({ id_produto: 10 });
      Entrada.createItem.mockResolvedValue(70);

      const resultado = await entradaService.criar(body);

      expect(resultado).toBe(7);
      expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
      expect(Entrada.create).toHaveBeenCalledWith(
        {
          id_funcionario: 3,
          data_entrada: "2026-09-25",
          observacao: null,
        },
        conn,
      );
      expect(Produto.findById).toHaveBeenCalledWith(10, conn);
      expect(Entrada.createItem).toHaveBeenCalledWith(
        {
          id_entrada: 7,
          id_produto: 10,
          quantidade: 5,
          valor_unitario: 2.5,
        },
        conn,
      );
      expect(Produto.incrementarEstoque).toHaveBeenCalledWith(10, 5, conn);
      expect(Lote.criar).toHaveBeenCalledWith(conn, {
        id_produto: 10,
        id_item_entrada: 70,
        numero_lote: null,
        quantidade: 5,
        data_validade: null,
      });
      expect(conn.commit).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    test("cria entrada com múltiplos itens: incrementa estoque e cria lote pra cada um", async () => {
      const body = bodyValido({
        itens: [
          itemValido({ id_produto: 10, quantidade: 5 }),
          itemValido({ id_produto: 20, quantidade: 3 }),
        ],
      });
      Entrada.create.mockResolvedValue(7);
      Produto.findById.mockResolvedValue({ id_produto: 10 });
      Entrada.createItem.mockResolvedValueOnce(70).mockResolvedValueOnce(71);

      await entradaService.criar(body);

      expect(Produto.incrementarEstoque).toHaveBeenNthCalledWith(
        1,
        10,
        5,
        conn,
      );
      expect(Produto.incrementarEstoque).toHaveBeenNthCalledWith(
        2,
        20,
        3,
        conn,
      );
      expect(Lote.criar).toHaveBeenCalledTimes(2);
      expect(conn.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe("atualizar", () => {
    test("404 quando entrada não existe", async () => {
      Entrada.findById.mockResolvedValue(null);

      await expect(
        entradaService.atualizar("1", { observacao: "teste" }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Entrada.update).not.toHaveBeenCalled();
    });

    test("rejeita itens no body sem gravar nada (não mutação parcial)", async () => {
      Entrada.findById.mockResolvedValue({ id_entrada: 1 });

      await expect(
        entradaService.atualizar("1", {
          observacao: "isso não pode ser salvo",
          itens: [{ id_produto: 10, quantidade: 1, valor_unitario: 1 }],
        }),
      ).rejects.toMatchObject({ statusCode: 501 });

      // ponto central do bug original: nada deve ter sido gravado
      expect(Entrada.update).not.toHaveBeenCalled();
    });

    test("rejeita quando nenhum campo válido é enviado", async () => {
      Entrada.findById.mockResolvedValue({ id_entrada: 1 });

      await expect(entradaService.atualizar("1", {})).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Entrada.update).not.toHaveBeenCalled();
    });

    test("rejeita id_funcionario inválido", async () => {
      Entrada.findById.mockResolvedValue({ id_entrada: 1 });

      await expect(
        entradaService.atualizar("1", { id_funcionario: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Entrada.update).not.toHaveBeenCalled();
    });

    test("rejeita data_entrada inválida", async () => {
      Entrada.findById.mockResolvedValue({ id_entrada: 1 });

      await expect(
        entradaService.atualizar("1", { data_entrada: "não é data" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Entrada.update).not.toHaveBeenCalled();
    });

    test("atualiza os campos válidos", async () => {
      Entrada.findById.mockResolvedValue({ id_entrada: 1 });
      Entrada.update.mockResolvedValue({ affectedRows: 1 });

      await entradaService.atualizar("1", {
        id_funcionario: "4",
        observacao: "  ajuste manual  ",
      });

      expect(Entrada.update).toHaveBeenCalledWith(1, {
        id_funcionario: 4,
        observacao: "ajuste manual",
      });
    });
  });

  describe("excluir", () => {
    test("rejeita id inválido", async () => {
      await expect(entradaService.excluir("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("sempre retorna 501 pra id válido (exclusão desabilitada)", async () => {
      await expect(entradaService.excluir("1")).rejects.toMatchObject({
        statusCode: 501,
      });
    });
  });
});
