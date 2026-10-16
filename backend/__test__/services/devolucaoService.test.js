jest.mock("../../src/models/devolucao");
jest.mock("../../src/models/produtos");
jest.mock("../../src/models/lote");
jest.mock("../../src/config/database");
jest.mock("../../src/utils/appError");

const pool = require("../../src/config/database");
const Devolucao = require("../../src/models/devolucao");
const Produto = require("../../src/models/produtos");
const Lote = require("../../src/models/lote");
const AppError = require("../../src/utils/appError");
const devolucaoService = require("../../src/services/devolucaoService");

const mockAppError = () => {
  AppError.mockImplementation((message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isAppError = true;
    return err;
  });
};

const criarConnMock = () => ({
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
});

describe("devolucaoService", () => {
  let conn;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppError();
    conn = criarConnMock();
    pool.getConnection = jest.fn().mockResolvedValue(conn);
  });

  const itemValido = { id_produto: 10, quantidade_devolvida: 2 };
  const bodyValido = () => ({
    id_saida: 1,
    id_funcionario: 3,
    data_devolucao: "2026-09-25",
    itens: [itemValido],
  });

  // Cenário padrão do banco: saída 1 vendeu 5 un. do produto 10, tiradas dos
  // lotes 100 (3 un.) e 101 (2 un.), e nada foi devolvido ainda.
  const prepararSaida = ({
    vendido = [{ id_produto: 10, total: "5" }],
    devolvido = [],
    consumos = [
      { id_saida_lote: 1, id_lote: 100, quantidade: 3 },
      { id_saida_lote: 2, id_lote: 101, quantidade: 2 },
    ],
  } = {}) => {
    Devolucao.travarSaida.mockResolvedValue({ id_saida: 1 });
    Devolucao.somarVendidoPorProduto.mockResolvedValue(vendido);
    Devolucao.somarDevolvidoPorProduto.mockResolvedValue(devolvido);
    Devolucao.listarConsumoDeLotes.mockResolvedValue(consumos);
    Devolucao.create.mockResolvedValue(77);
    Devolucao.createItem.mockResolvedValue(1);
    Produto.incrementarEstoque.mockResolvedValue({ affectedRows: 1 });
    Lote.devolverQuantidade.mockResolvedValue(undefined);
  };

  describe("listarTodas", () => {
    it("retorna a lista vinda do model", async () => {
      const devolucoes = [{ id: 1 }, { id: 2 }];
      Devolucao.findAll.mockResolvedValue(devolucoes);

      const resultado = await devolucaoService.listarTodas();

      expect(Devolucao.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(devolucoes);
    });

    it("propaga erro do model", async () => {
      Devolucao.findAll.mockRejectedValue(new Error("Falha de conexão"));
      await expect(devolucaoService.listarTodas()).rejects.toThrow(
        "Falha de conexão",
      );
    });
  });

  describe("buscarPorId", () => {
    it.each([
      ["não numérico", "abc"],
      ["zero", "0"],
      ["negativo", "-1"],
      ["decimal", "1.5"],
    ])(
      "lança AppError 400 para id inválido (%s)",
      async (_desc, idInvalido) => {
        await expect(
          devolucaoService.buscarPorId(idInvalido),
        ).rejects.toMatchObject({
          message: "ID inválido",
          statusCode: 400,
        });
        expect(Devolucao.findById).not.toHaveBeenCalled();
      },
    );

    it("lança AppError 404 quando não encontrada", async () => {
      Devolucao.findById.mockResolvedValue(null);

      await expect(devolucaoService.buscarPorId("1")).rejects.toMatchObject({
        message: "Devolução não encontrada",
        statusCode: 404,
      });
      expect(Devolucao.findItensByDevolucao).not.toHaveBeenCalled();
    });

    it("retorna devolução com itens anexados quando encontrada", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1, id_saida: 5 });
      Devolucao.findItensByDevolucao.mockResolvedValue([itemValido]);

      const resultado = await devolucaoService.buscarPorId("1");

      expect(Devolucao.findItensByDevolucao).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ id: 1, id_saida: 5, itens: [itemValido] });
    });
  });

  describe("criar", () => {
    it.each([
      ["id_saida ausente", { ...bodyValido(), id_saida: undefined }],
      ["id_funcionario null", { ...bodyValido(), id_funcionario: null }],
      ["data_devolucao vazia", { ...bodyValido(), data_devolucao: "" }],
      ["itens ausente", { ...bodyValido(), itens: undefined }],
    ])(
      "lança AppError 400 quando campo obrigatório falta (%s)",
      async (_desc, body) => {
        await expect(devolucaoService.criar(body)).rejects.toMatchObject({
          statusCode: 400,
        });
        expect(pool.getConnection).not.toHaveBeenCalled();
        expect(Devolucao.create).not.toHaveBeenCalled();
      },
    );

    it("lança AppError 400 quando itens é array vazio", async () => {
      await expect(
        devolucaoService.criar({ ...bodyValido(), itens: [] }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    it("lança AppError 400 quando itens não é array", async () => {
      await expect(
        devolucaoService.criar({ ...bodyValido(), itens: "x" }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("lança AppError 400 quando item não tem id_produto", async () => {
      await expect(
        devolucaoService.criar({
          ...bodyValido(),
          itens: [{ quantidade_devolvida: 1 }],
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it.each([0, -1, 1.5, "abc"])(
      "lança AppError 400 quando quantidade_devolvida é inválida (%p)",
      async (qtd) => {
        await expect(
          devolucaoService.criar({
            ...bodyValido(),
            itens: [{ id_produto: 10, quantidade_devolvida: qtd }],
          }),
        ).rejects.toMatchObject({
          statusCode: 400,
          message: expect.stringContaining("quantidade devolvida inválida"),
        });
        expect(pool.getConnection).not.toHaveBeenCalled();
      },
    );

    it.each(["abc", 0, -2, 1.5])(
      "rejeita id_saida inválido (%p) com 400, sem abrir transação",
      async (idSaida) => {
        await expect(
          devolucaoService.criar({ ...bodyValido(), id_saida: idSaida }),
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(pool.getConnection).not.toHaveBeenCalled();
      },
    );

    it("devolve ao estoque e aos lotes de origem, grava o item e confirma a transação", async () => {
      prepararSaida();

      const id = await devolucaoService.criar({
        ...bodyValido(),
        itens: [{ id_produto: 10, quantidade_devolvida: 4 }],
      });

      expect(id).toBe(77);
      expect(Devolucao.travarSaida).toHaveBeenCalledWith(1, conn);
      expect(Devolucao.create).toHaveBeenCalledWith(
        {
          id_saida: 1,
          id_funcionario: 3,
          data_devolucao: "2026-09-25",
          motivo: null,
        },
        conn,
      );
      expect(Produto.incrementarEstoque).toHaveBeenCalledWith(10, 4, conn);
      // 4 devolvidas: lote 100 recebe tudo o que deu (3) e o 101 recebe 1
      expect(Lote.devolverQuantidade).toHaveBeenCalledTimes(2);
      expect(Lote.devolverQuantidade).toHaveBeenNthCalledWith(1, conn, 100, 3);
      expect(Lote.devolverQuantidade).toHaveBeenNthCalledWith(2, conn, 101, 1);
      expect(Devolucao.createItem).toHaveBeenCalledWith(
        { id_devolucao: 77, id_produto: 10, quantidade_devolvida: 4 },
        conn,
      );
      expect(conn.commit).toHaveBeenCalledTimes(1);
      expect(conn.rollback).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    it("trima motivo quando informado", async () => {
      prepararSaida();
      await devolucaoService.criar({ ...bodyValido(), motivo: "  defeito  " });
      expect(Devolucao.create).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: "defeito" }),
        conn,
      );
    });

    it("continua de onde a devolução anterior parou (não repõe duas vezes o mesmo lote)", async () => {
      // já foram devolvidas 3 un. (= lote 100 inteiro); 2 un. novas vão ao lote 101
      prepararSaida({ devolvido: [{ id_produto: 10, total: "3" }] });

      await devolucaoService.criar({
        ...bodyValido(),
        itens: [{ id_produto: 10, quantidade_devolvida: 2 }],
      });

      expect(Lote.devolverQuantidade).toHaveBeenCalledTimes(1);
      expect(Lote.devolverQuantidade).toHaveBeenCalledWith(conn, 101, 2);
    });

    it("soma itens repetidos do mesmo produto e processa em ordem de id_produto", async () => {
      prepararSaida({
        vendido: [
          { id_produto: 10, total: "5" },
          { id_produto: 20, total: "5" },
        ],
      });

      await devolucaoService.criar({
        ...bodyValido(),
        itens: [
          { id_produto: 20, quantidade_devolvida: 1 },
          { id_produto: 10, quantidade_devolvida: 1 },
          { id_produto: 20, quantidade_devolvida: 1 },
        ],
      });

      expect(Produto.incrementarEstoque).toHaveBeenCalledTimes(2);
      expect(Produto.incrementarEstoque).toHaveBeenNthCalledWith(
        1,
        10,
        1,
        conn,
      );
      expect(Produto.incrementarEstoque).toHaveBeenNthCalledWith(
        2,
        20,
        2,
        conn,
      );
      expect(Devolucao.createItem).toHaveBeenCalledTimes(2);
    });

    it("lança 404 e desfaz quando a saída não existe", async () => {
      Devolucao.travarSaida.mockResolvedValue(null);

      await expect(devolucaoService.criar(bodyValido())).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(Devolucao.create).not.toHaveBeenCalled();
      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    it("lança 400 quando o produto não faz parte da saída", async () => {
      prepararSaida({ vendido: [{ id_produto: 99, total: "5" }] });

      await expect(devolucaoService.criar(bodyValido())).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Produto.incrementarEstoque).not.toHaveBeenCalled();
      expect(conn.rollback).toHaveBeenCalledTimes(1);
    });

    it("lança 409 quando excede o saldo devolvível (vendido - já devolvido)", async () => {
      prepararSaida({ devolvido: [{ id_produto: 10, total: "4" }] }); // saldo 1

      await expect(
        devolucaoService.criar({
          ...bodyValido(),
          itens: [{ id_produto: 10, quantidade_devolvida: 2 }],
        }),
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(Produto.incrementarEstoque).not.toHaveBeenCalled();
      expect(Lote.devolverQuantidade).not.toHaveBeenCalled();
      expect(Devolucao.createItem).not.toHaveBeenCalled();
      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
    });

    it("lança 409 quando a saída não tem lote registrado (anterior ao controle de lotes)", async () => {
      prepararSaida({ consumos: [] });

      await expect(devolucaoService.criar(bodyValido())).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("controle de lotes"),
      });
      expect(Produto.incrementarEstoque).not.toHaveBeenCalled();
      expect(Lote.devolverQuantidade).not.toHaveBeenCalled();
      expect(conn.rollback).toHaveBeenCalledTimes(1);
    });

    it("desfaz a transação inteira e propaga o erro original se um passo falhar no meio", async () => {
      prepararSaida();
      const erro = new Error("falha no createItem");
      Devolucao.createItem.mockRejectedValue(erro);

      await expect(devolucaoService.criar(bodyValido())).rejects.toBe(erro);

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("atualizar", () => {
    it("lança AppError 400 para id inválido", async () => {
      await expect(
        devolucaoService.atualizar("abc", { motivo: "x" }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("lança AppError 404 quando não encontrada", async () => {
      Devolucao.findById.mockResolvedValue(null);
      await expect(
        devolucaoService.atualizar(1, { motivo: "x" }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Devolucao.update).not.toHaveBeenCalled();
    });

    it.each([
      ["itens", { itens: [itemValido] }],
      ["itens vazio", { itens: [] }],
      ["id_saida", { id_saida: 2 }],
    ])(
      "rejeita com 501 alterar %s, sem gravar nada nem mexer em estoque/lotes",
      async (_desc, body) => {
        Devolucao.findById.mockResolvedValue({ id_devolucao: 1 });

        await expect(
          devolucaoService.atualizar(1, { motivo: "novo", ...body }),
        ).rejects.toMatchObject({ statusCode: 501 });

        expect(Devolucao.update).not.toHaveBeenCalled();
        expect(Produto.incrementarEstoque).not.toHaveBeenCalled();
        expect(Lote.devolverQuantidade).not.toHaveBeenCalled();
      },
    );

    it("lança AppError 400 quando body não tem campo válido", async () => {
      Devolucao.findById.mockResolvedValue({ id_devolucao: 1 });
      await expect(devolucaoService.atualizar(1, {})).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("atualiza apenas os campos informados", async () => {
      Devolucao.findById.mockResolvedValue({ id_devolucao: 1 });
      await devolucaoService.atualizar(1, {
        motivo: "  troca  ",
        data_devolucao: "2026-10-01",
        id_funcionario: "4",
      });
      expect(Devolucao.update).toHaveBeenCalledWith(1, {
        motivo: "troca",
        data_devolucao: "2026-10-01",
        id_funcionario: 4,
      });
    });

    it("permite limpar motivo passando null", async () => {
      Devolucao.findById.mockResolvedValue({ id_devolucao: 1 });
      await devolucaoService.atualizar(1, { motivo: null });
      expect(Devolucao.update).toHaveBeenCalledWith(1, { motivo: null });
    });

    it("rejeita id_funcionario inválido com 400", async () => {
      Devolucao.findById.mockResolvedValue({ id_devolucao: 1 });
      await expect(
        devolucaoService.atualizar(1, { id_funcionario: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Devolucao.update).not.toHaveBeenCalled();
    });
  });

  describe("excluir", () => {
    it("lança AppError 400 para id inválido", async () => {
      await expect(devolucaoService.excluir("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("lança 501: excluir não reverte estoque/lotes, então não é permitido", async () => {
      await expect(devolucaoService.excluir(1)).rejects.toMatchObject({
        statusCode: 501,
      });
      expect(Produto.incrementarEstoque).not.toHaveBeenCalled();
      expect(Lote.devolverQuantidade).not.toHaveBeenCalled();
    });
  });
});
