jest.mock("../../src/models/ajuste");
jest.mock("../../src/models/produtos");
jest.mock("../../src/config/database");

const Ajuste = require("../../src/models/ajuste");
const Produto = require("../../src/models/produtos");
const pool = require("../../src/config/database");
const ajusteService = require("../../src/services/ajusteService");

const criarConnMock = () => ({
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
});

describe("ajusteService", () => {
  let conn;

  beforeEach(() => {
    conn = criarConnMock();
    pool.getConnection = jest.fn().mockResolvedValue(conn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listarTodos", () => {
    test("delega direto para Ajuste.findAll", async () => {
      const lista = [{ id_ajuste: 1 }, { id_ajuste: 2 }];
      Ajuste.findAll.mockResolvedValue(lista);

      const resultado = await ajusteService.listarTodos();

      expect(Ajuste.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(lista);
    });
  });

  describe("buscarPorId", () => {
    test("retorna o ajuste quando existe", async () => {
      const ajuste = { id_ajuste: 1, tipo_ajuste: "entrada" };
      Ajuste.findById.mockResolvedValue(ajuste);

      const resultado = await ajusteService.buscarPorId("1");

      expect(Ajuste.findById).toHaveBeenCalledWith(1);
      expect(resultado).toBe(ajuste);
    });

    test("rejeita id inválido sem chamar o banco", async () => {
      await expect(ajusteService.buscarPorId("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Ajuste.findById).not.toHaveBeenCalled();
    });

    test("404 quando não encontrado", async () => {
      Ajuste.findById.mockResolvedValue(null);

      await expect(ajusteService.buscarPorId("99")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("criar", () => {
    const bodyValido = (overrides = {}) => ({
      id_funcionario: 3,
      id_produto: 10,
      quantidade_ajustada: 5,
      tipo_ajuste: "entrada",
      data_ajuste: "2026-09-25",
      ...overrides,
    });

    test("rejeita quando falta campo obrigatório, sem abrir conexão", async () => {
      const { tipo_ajuste, ...semTipo } = bodyValido();

      await expect(ajusteService.criar(semTipo)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita tipo_ajuste inválido", async () => {
      const body = bodyValido({ tipo_ajuste: "transferencia" });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita data_ajuste inválida", async () => {
      const body = bodyValido({ data_ajuste: "não é data" });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita id_funcionario inválido, sem abrir conexão", async () => {
      const body = bodyValido({ id_funcionario: "abc" });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita id_produto inválido, sem abrir conexão", async () => {
      const body = bodyValido({ id_produto: "abc" });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita quantidade_ajustada não numérica (o bug do NaN escapando da coerência)", async () => {
      const body = bodyValido({ quantidade_ajustada: "abc" });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
      expect(Produto.decrementarEstoque).not.toHaveBeenCalled();
    });

    test("rejeita quantidade_ajustada igual a zero", async () => {
      const body = bodyValido({ quantidade_ajustada: 0 });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita tipo 'entrada' com quantidade negativa", async () => {
      const body = bodyValido({
        tipo_ajuste: "entrada",
        quantidade_ajustada: -5,
      });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("rejeita tipo 'saida' com quantidade positiva", async () => {
      const body = bodyValido({
        tipo_ajuste: "saida",
        quantidade_ajustada: 5,
      });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test("aceita tipo 'correcao' com quantidade positiva ou negativa", async () => {
      Produto.findById.mockResolvedValue({
        id_produto: 10,
        nome_produto: "Resistor",
        quantidade_estoque: 100,
      });
      Ajuste.create.mockResolvedValue(1);

      await expect(
        ajusteService.criar(
          bodyValido({ tipo_ajuste: "correcao", quantidade_ajustada: 5 }),
        ),
      ).resolves.toBe(1);

      await expect(
        ajusteService.criar(
          bodyValido({ tipo_ajuste: "correcao", quantidade_ajustada: -5 }),
        ),
      ).resolves.toBe(1);
    });

    test("rejeita quando produto não existe, com rollback e release", async () => {
      Produto.findById.mockResolvedValue(null);

      await expect(ajusteService.criar(bodyValido())).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
      expect(Ajuste.create).not.toHaveBeenCalled();
    });

    test("quantidade positiva incrementa estoque, não decrementa", async () => {
      Produto.findById.mockResolvedValue({
        id_produto: 10,
        nome_produto: "Resistor",
        quantidade_estoque: 100,
      });
      Ajuste.create.mockResolvedValue(1);

      await ajusteService.criar(bodyValido({ quantidade_ajustada: 5 }));

      expect(Produto.incrementarEstoque).toHaveBeenCalledWith(10, 5, conn);
      expect(Produto.decrementarEstoque).not.toHaveBeenCalled();
    });

    test("quantidade negativa decrementa estoque com valor absoluto", async () => {
      Produto.findById.mockResolvedValue({
        id_produto: 10,
        nome_produto: "Resistor",
        quantidade_estoque: 100,
      });
      Produto.decrementarEstoque.mockResolvedValue(true);
      Ajuste.create.mockResolvedValue(1);

      await ajusteService.criar(
        bodyValido({ tipo_ajuste: "saida", quantidade_ajustada: -5 }),
      );

      expect(Produto.decrementarEstoque).toHaveBeenCalledWith(10, 5, conn);
      expect(Produto.incrementarEstoque).not.toHaveBeenCalled();
    });

    test("estoque insuficiente: rejeita, com rollback e release", async () => {
      Produto.findById.mockResolvedValue({
        id_produto: 10,
        nome_produto: "Resistor",
        quantidade_estoque: 3,
      });
      Produto.decrementarEstoque.mockResolvedValue(false);

      const body = bodyValido({
        tipo_ajuste: "saida",
        quantidade_ajustada: -5,
      });

      await expect(ajusteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
      expect(Ajuste.create).not.toHaveBeenCalled();
    });

    test("propaga erro inesperado em Ajuste.create, com rollback e release", async () => {
      Produto.findById.mockResolvedValue({
        id_produto: 10,
        nome_produto: "Resistor",
        quantidade_estoque: 100,
      });
      Ajuste.create.mockRejectedValue(new Error("falha de conexão"));

      await expect(ajusteService.criar(bodyValido())).rejects.toThrow(
        "falha de conexão",
      );

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    test("cria ajuste com sucesso: sequência completa de chamadas", async () => {
      Produto.findById.mockResolvedValue({
        id_produto: 10,
        nome_produto: "Resistor",
        quantidade_estoque: 100,
      });
      Ajuste.create.mockResolvedValue(9);

      const resultado = await ajusteService.criar(
        bodyValido({ motivo: "  contagem de inventário  " }),
      );

      expect(resultado).toBe(9);
      expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
      expect(Produto.findById).toHaveBeenCalledWith(10, conn);
      expect(Ajuste.create).toHaveBeenCalledWith(
        {
          id_funcionario: 3,
          id_produto: 10,
          quantidade_ajustada: 5,
          tipo_ajuste: "entrada",
          data_ajuste: "2026-09-25",
          motivo: "contagem de inventário",
        },
        conn,
      );
      expect(conn.commit).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    test("motivo ausente vira null", async () => {
      Produto.findById.mockResolvedValue({
        id_produto: 10,
        nome_produto: "Resistor",
        quantidade_estoque: 100,
      });
      Ajuste.create.mockResolvedValue(9);

      await ajusteService.criar(bodyValido());

      expect(Ajuste.create).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: null }),
        conn,
      );
    });
  });

  describe("atualizar", () => {
    test("sempre retorna 501, independente dos argumentos", async () => {
      await expect(
        ajusteService.atualizar("1", { motivo: "tentativa" }),
      ).rejects.toMatchObject({ statusCode: 501 });
    });
  });

  describe("excluir", () => {
    test("sempre retorna 501, independente dos argumentos", async () => {
      await expect(ajusteService.excluir("1")).rejects.toMatchObject({
        statusCode: 501,
      });
    });
  });
});
