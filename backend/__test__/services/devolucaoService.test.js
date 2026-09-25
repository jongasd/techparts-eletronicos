jest.mock("../models/devolucao");
jest.mock("../utils/appError");

const Devolucao = require("../models/devolucao");
const AppError = require("../utils/appError");
const devolucaoService = require("../services/devolucaoService"); // ajuste o caminho se necessário

const mockAppError = () => {
  AppError.mockImplementation((message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isAppError = true;
    return err;
  });
};

describe("devolucaoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppError();
  });

  const itemValido = { id_produto: 10, quantidade_devolvida: 2 };
  const bodyValido = () => ({
    id_saida: 1,
    id_funcionario: 3,
    data_devolucao: "2026-09-25",
    itens: [itemValido],
  });

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
        expect(Devolucao.create).not.toHaveBeenCalled();
      },
    );

    it("lança AppError 400 quando itens é array vazio", async () => {
      await expect(
        devolucaoService.criar({ ...bodyValido(), itens: [] }),
      ).rejects.toMatchObject({
        message: "É necessário informar ao menos um item na devolução",
        statusCode: 400,
      });
    });

    it("lança AppError 400 quando itens não é array", async () => {
      await expect(
        devolucaoService.criar({ ...bodyValido(), itens: "não-array" }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("lança AppError 400 quando item não tem id_produto", async () => {
      const body = { ...bodyValido(), itens: [{ quantidade_devolvida: 1 }] };
      await expect(devolucaoService.criar(body)).rejects.toMatchObject({
        message: expect.stringContaining("posição 1"),
        statusCode: 400,
      });
    });

    it("lança AppError 400 quando quantidade_devolvida é <= 0", async () => {
      const body = {
        ...bodyValido(),
        itens: [{ id_produto: 1, quantidade_devolvida: 0 }],
      };
      await expect(devolucaoService.criar(body)).rejects.toMatchObject({
        message: expect.stringContaining("quantidade devolvida inválida"),
        statusCode: 400,
      });
    });

    it("cria devolução e itens quando tudo é válido", async () => {
      Devolucao.create.mockResolvedValue(42);
      Devolucao.createItem.mockResolvedValue(undefined);

      const resultado = await devolucaoService.criar(bodyValido());

      expect(Devolucao.create).toHaveBeenCalledWith({
        id_saida: 1,
        id_funcionario: 3,
        data_devolucao: "2026-09-25",
        motivo: null,
      });
      expect(Devolucao.createItem).toHaveBeenCalledWith({
        id_devolucao: 42,
        id_produto: 10,
        quantidade_devolvida: 2,
      });
      expect(resultado).toBe(42);
    });

    it("trima motivo quando informado", async () => {
      Devolucao.create.mockResolvedValue(1);
      Devolucao.createItem.mockResolvedValue(undefined);

      await devolucaoService.criar({
        ...bodyValido(),
        motivo: "  produto vencido  ",
      });

      expect(Devolucao.create).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: "produto vencido" }),
      );
    });

    it("cria um item por entrada em itens, na ordem informada", async () => {
      Devolucao.create.mockResolvedValue(7);
      Devolucao.createItem.mockResolvedValue(undefined);
      const itens = [
        { id_produto: 1, quantidade_devolvida: 1 },
        { id_produto: 2, quantidade_devolvida: 5 },
      ];

      await devolucaoService.criar({ ...bodyValido(), itens });

      expect(Devolucao.createItem).toHaveBeenCalledTimes(2);
      expect(Devolucao.createItem).toHaveBeenNthCalledWith(1, {
        id_devolucao: 7,
        id_produto: 1,
        quantidade_devolvida: 1,
      });
      expect(Devolucao.createItem).toHaveBeenNthCalledWith(2, {
        id_devolucao: 7,
        id_produto: 2,
        quantidade_devolvida: 5,
      });
    });


    it("[BUG] aceita quantidade_devolvida não numérica e grava NaN", async () => {
      Devolucao.create.mockResolvedValue(1);
      Devolucao.createItem.mockResolvedValue(undefined);
      const body = {
        ...bodyValido(),
        itens: [{ id_produto: 1, quantidade_devolvida: "abc" }],
      };

      await devolucaoService.criar(body);

      expect(Devolucao.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ quantidade_devolvida: NaN }),
      );
    });

    it("[BUG] aceita id_saida não numérico e grava NaN sem erro", async () => {
      Devolucao.create.mockResolvedValue(1);
      Devolucao.createItem.mockResolvedValue(undefined);

      await devolucaoService.criar({ ...bodyValido(), id_saida: "abc" });

      expect(Devolucao.create).toHaveBeenCalledWith(
        expect.objectContaining({ id_saida: NaN }),
      );
    });

    it("[FRÁGIL] não desfaz itens já criados se um createItem subsequente falhar", async () => {
      Devolucao.create.mockResolvedValue(9);
      Devolucao.createItem
        .mockResolvedValueOnce(undefined) // primeiro item: sucesso
        .mockRejectedValueOnce(new Error("Falha ao inserir item")); // segundo: falha

      const itens = [
        { id_produto: 1, quantidade_devolvida: 1 },
        { id_produto: 2, quantidade_devolvida: 1 },
      ];

      await expect(
        devolucaoService.criar({ ...bodyValido(), itens }),
      ).rejects.toThrow("Falha ao inserir item");

      expect(Devolucao.createItem).toHaveBeenCalledTimes(2);
    });
  });

  describe("atualizar", () => {
    it("lança AppError 400 para id inválido", async () => {
      await expect(devolucaoService.atualizar("abc", {})).rejects.toMatchObject(
        {
          message: "ID inválido",
          statusCode: 400,
        },
      );
    });

    it("lança AppError 404 quando não encontrada", async () => {
      Devolucao.findById.mockResolvedValue(null);
      await expect(
        devolucaoService.atualizar("1", { motivo: "x" }),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança AppError 400 quando body está vazio (sem campos e sem itens)", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      await expect(devolucaoService.atualizar("1", {})).rejects.toMatchObject({
        message: "Nenhum campo válido informado para atualização",
        statusCode: 400,
      });
      expect(Devolucao.update).not.toHaveBeenCalled();
    });

    it("atualiza apenas os campos informados, mantendo os demais intocados", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      Devolucao.update.mockResolvedValue(undefined);

      await devolucaoService.atualizar("1", {
        motivo: "  embalagem violada  ",
      });

      expect(Devolucao.update).toHaveBeenCalledWith(1, {
        motivo: "embalagem violada",
      });
      expect(Devolucao.deleteItensByDevolucao).not.toHaveBeenCalled();
    });

    it("permite limpar motivo passando null", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      Devolucao.update.mockResolvedValue(undefined);

      await devolucaoService.atualizar("1", { motivo: null });

      expect(Devolucao.update).toHaveBeenCalledWith(1, { motivo: null });
    });

    it("valida itens antes de apagar os existentes quando itens é array vazio", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });

      await expect(
        devolucaoService.atualizar("1", { itens: [] }),
      ).rejects.toMatchObject({
        message: "É necessário informar ao menos um item na devolução",
        statusCode: 400,
      });
      expect(Devolucao.deleteItensByDevolucao).not.toHaveBeenCalled();
    });

    it("substitui itens quando um array válido é informado", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      Devolucao.deleteItensByDevolucao.mockResolvedValue(undefined);
      Devolucao.createItem.mockResolvedValue(undefined);
      const itens = [{ id_produto: 5, quantidade_devolvida: 3 }];

      await devolucaoService.atualizar("1", { itens });

      expect(Devolucao.deleteItensByDevolucao).toHaveBeenCalledWith(1);
      expect(Devolucao.createItem).toHaveBeenCalledWith({
        id_devolucao: 1,
        id_produto: 5,
        quantidade_devolvida: 3,
      });
    });

    it("atualiza campos e substitui itens na mesma chamada", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      Devolucao.update.mockResolvedValue(undefined);
      Devolucao.deleteItensByDevolucao.mockResolvedValue(undefined);
      Devolucao.createItem.mockResolvedValue(undefined);

      await devolucaoService.atualizar("1", {
        motivo: "novo motivo",
        itens: [{ id_produto: 1, quantidade_devolvida: 1 }],
      });

      expect(Devolucao.update).toHaveBeenCalledWith(1, {
        motivo: "novo motivo",
      });
      expect(Devolucao.deleteItensByDevolucao).toHaveBeenCalledWith(1);
      expect(Devolucao.createItem).toHaveBeenCalledTimes(1);
    });

    // FRÁGIL: mesma ausência de transação do `criar` — se createItem falhar
    // depois do deleteItensByDevolucao, os itens antigos já foram apagados
    // e os novos ficam incompletos.
    it("[FRÁGIL] deixa itens antigos apagados mesmo se a recriação falhar", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      Devolucao.deleteItensByDevolucao.mockResolvedValue(undefined);
      Devolucao.createItem.mockRejectedValue(
        new Error("Falha ao inserir item"),
      );

      await expect(
        devolucaoService.atualizar("1", {
          itens: [{ id_produto: 1, quantidade_devolvida: 1 }],
        }),
      ).rejects.toThrow("Falha ao inserir item");

      expect(Devolucao.deleteItensByDevolucao).toHaveBeenCalledWith(1);
    });
  });

 
  describe("excluir", () => {
    it("lança AppError 400 para id inválido", async () => {
      await expect(devolucaoService.excluir("0")).rejects.toMatchObject({
        message: "ID inválido",
        statusCode: 400,
      });
    });

    it("lança AppError 404 quando não encontrada", async () => {
      Devolucao.findById.mockResolvedValue(null);
      await expect(devolucaoService.excluir("1")).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(Devolucao.deleteItensByDevolucao).not.toHaveBeenCalled();
    });

    it("apaga itens e depois a devolução, nessa ordem", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      Devolucao.deleteItensByDevolucao.mockResolvedValue(undefined);
      Devolucao.delete.mockResolvedValue(undefined);

      await devolucaoService.excluir("1");

      const ordemItens =
        Devolucao.deleteItensByDevolucao.mock.invocationCallOrder[0];
      const ordemDevolucao = Devolucao.delete.mock.invocationCallOrder[0];
      expect(ordemItens).toBeLessThan(ordemDevolucao);
    });

    it("[FRÁGIL] itens já apagados permanecem apagados se o delete da devolução falhar", async () => {
      Devolucao.findById.mockResolvedValue({ id: 1 });
      Devolucao.deleteItensByDevolucao.mockResolvedValue(undefined);
      Devolucao.delete.mockRejectedValue(
        new Error("Falha ao apagar devolução"),
      );

      await expect(devolucaoService.excluir("1")).rejects.toThrow(
        "Falha ao apagar devolução",
      );
      expect(Devolucao.deleteItensByDevolucao).toHaveBeenCalledWith(1);
    });
  });
});
