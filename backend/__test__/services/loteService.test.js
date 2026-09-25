jest.mock("../models/lote");
jest.mock("../models/produtos");
jest.mock("../utils/appError");

const Lote = require("../models/lote");
const Produto = require("../models/produtos");
const AppError = require("../utils/appError");
const loteService = require("../services/loteService"); // ajuste o caminho se necessário

const mockAppError = () => {
  AppError.mockImplementation((message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isAppError = true;
    return err;
  });
};

describe("loteService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppError();
  });

  describe("listarPorProduto", () => {
    it.each([
      ["não numérico", "abc"],
      ["zero", "0"],
      ["negativo", "-2"],
      ["decimal", "3.2"],
    ])(
      "lança AppError 400 para id_produto inválido (%s)",
      async (_desc, idInvalido) => {
        await expect(
          loteService.listarPorProduto(idInvalido),
        ).rejects.toMatchObject({
          message: "ID inválido",
          statusCode: 400,
        });
        expect(Produto.findById).not.toHaveBeenCalled();
      },
    );

    it("lança AppError 404 quando o produto não existe", async () => {
      Produto.findById.mockResolvedValue(null);

      await expect(loteService.listarPorProduto("1")).rejects.toMatchObject({
        message: "Produto não encontrado",
        statusCode: 404,
      });
      expect(Lote.listarPorProduto).not.toHaveBeenCalled();
    });

    it("retorna os lotes do produto quando ele existe", async () => {
      Produto.findById.mockResolvedValue({ id: 1, nome: "Leite" });
      const lotes = [{ id: 10, id_produto: 1, quantidade: 50 }];
      Lote.listarPorProduto.mockResolvedValue(lotes);

      const resultado = await loteService.listarPorProduto("1");

      expect(Produto.findById).toHaveBeenCalledWith(1);
      expect(Lote.listarPorProduto).toHaveBeenCalledWith(1);
      expect(resultado).toEqual(lotes);
    });

    it("retorna array vazio quando produto existe mas não tem lotes", async () => {
      Produto.findById.mockResolvedValue({ id: 1 });
      Lote.listarPorProduto.mockResolvedValue([]);

      const resultado = await loteService.listarPorProduto("1");

      expect(resultado).toEqual([]);
    });

    it("propaga erro do model Lote sem tratamento", async () => {
      Produto.findById.mockResolvedValue({ id: 1 });
      Lote.listarPorProduto.mockRejectedValue(new Error("Falha de conexão"));

      await expect(loteService.listarPorProduto("1")).rejects.toThrow(
        "Falha de conexão",
      );
    });
  });

  describe("listarVencendo", () => {
    it("usa 30 como padrão quando diasQuery é undefined", async () => {
      Lote.listarVencendo.mockResolvedValue([]);

      await loteService.listarVencendo(undefined);

      expect(Lote.listarVencendo).toHaveBeenCalledWith(30);
    });

    it("usa o valor informado quando é um número válido em string", async () => {
      Lote.listarVencendo.mockResolvedValue([]);

      await loteService.listarVencendo("45");

      expect(Lote.listarVencendo).toHaveBeenCalledWith(45);
    });

    it("aceita 0 como valor explícito (lotes vencendo hoje)", async () => {
      Lote.listarVencendo.mockResolvedValue([]);

      await loteService.listarVencendo("0");

      expect(Lote.listarVencendo).toHaveBeenCalledWith(0);
    });

    it("lança AppError 400 para valor negativo", async () => {
      await expect(loteService.listarVencendo("-5")).rejects.toMatchObject({
        message: "Parâmetro 'dias' inválido",
        statusCode: 400,
      });
      expect(Lote.listarVencendo).not.toHaveBeenCalled();
    });

    it("lança AppError 400 para valor não numérico", async () => {
      await expect(loteService.listarVencendo("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Lote.listarVencendo).not.toHaveBeenCalled();
    });

    it("lança AppError 400 para Infinity", async () => {
      await expect(
        loteService.listarVencendo("Infinity"),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("[BUG] trata diasQuery vazio ('') como 0 em vez de aplicar o padrão de 30", async () => {
      Lote.listarVencendo.mockResolvedValue([]);

      await loteService.listarVencendo("");

      expect(Lote.listarVencendo).toHaveBeenCalledWith(0);
    });

    it("[LOOSE] aceita valores decimais para 'dias'", async () => {
      Lote.listarVencendo.mockResolvedValue([]);

      await loteService.listarVencendo("10.5");

      expect(Lote.listarVencendo).toHaveBeenCalledWith(10.5);
    });

    it("propaga erro do model sem tratamento", async () => {
      Lote.listarVencendo.mockRejectedValue(new Error("Falha de conexão"));

      await expect(loteService.listarVencendo("30")).rejects.toThrow(
        "Falha de conexão",
      );
    });
  });
});
