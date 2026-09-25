jest.mock("../models/categoria");
jest.mock("../utils/appError");

const Categoria = require("../models/categoria");
const AppError = require("../utils/appError");
const categoriaService = require("../services/categoriaService");

AppError.mockImplementation((message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.isAppError = true;
  return err;
});

describe("categoriaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AppError.mockImplementation((message, statusCode) => {
      const err = new Error(message);
      err.statusCode = statusCode;
      err.isAppError = true;
      return err;
    });
  });

  describe("listarTodas", () => {
    it("retorna a lista de categorias vinda do model", async () => {
      const categorias = [
        { id: 1, nome: "Bebidas" },
        { id: 2, nome: "Lanches" },
      ];
      Categoria.findAll.mockResolvedValue(categorias);

      const resultado = await categoriaService.listarTodas();

      expect(Categoria.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(categorias);
    });

    it("retorna array vazio quando não há categorias", async () => {
      Categoria.findAll.mockResolvedValue([]);

      const resultado = await categoriaService.listarTodas();

      expect(resultado).toEqual([]);
    });

    it("propaga erro do model sem modificá-lo", async () => {
      const erroBanco = new Error("Falha de conexão");
      Categoria.findAll.mockRejectedValue(erroBanco);

      await expect(categoriaService.listarTodas()).rejects.toThrow(
        "Falha de conexão",
      );
    });
  });

  describe("buscarPorId", () => {
    it.each([
      ["string não numérica", "abc"],
      ["decimal", "1.5"],
      ["zero", "0"],
      ["negativo", "-3"],
      ["vazio", ""],
      ["undefined", undefined],
      ["null", null],
    ])(
      "lança AppError 400 para id inválido (%s)",
      async (_desc, idInvalido) => {
        await expect(
          categoriaService.buscarPorId(idInvalido),
        ).rejects.toMatchObject({
          message: "ID inválido",
          statusCode: 400,
        });
        expect(Categoria.findById).not.toHaveBeenCalled();
      },
    );

    it("lança AppError 404 quando a categoria não existe", async () => {
      Categoria.findById.mockResolvedValue(null);

      await expect(categoriaService.buscarPorId("5")).rejects.toMatchObject({
        message: "Categoria não encontrada",
        statusCode: 404,
      });
      expect(Categoria.findById).toHaveBeenCalledWith(5);
    });

    it("retorna a categoria quando encontrada, convertendo id string para número", async () => {
      const categoria = { id: 5, nome: "Sobremesas" };
      Categoria.findById.mockResolvedValue(categoria);

      const resultado = await categoriaService.buscarPorId("5");

      expect(Categoria.findById).toHaveBeenCalledWith(5);
      expect(resultado).toEqual(categoria);
    });
  });

  describe("criar", () => {
    it.each([
      ["ausente", {}],
      ["undefined", { nome: undefined }],
      ["null", { nome: null }],
      ["string vazia", { nome: "" }],
    ])("lança AppError 400 quando nome está %s", async (_desc, body) => {
      await expect(categoriaService.criar(body)).rejects.toMatchObject({
        message: "Campos obrigatórios ausentes: nome",
        statusCode: 400,
      });
      expect(Categoria.create).not.toHaveBeenCalled();
    });

    it("cria a categoria com nome trimado quando válido", async () => {
      const categoriaCriada = { id: 1, nome: "Bebidas" };
      Categoria.create.mockResolvedValue(categoriaCriada);

      const resultado = await categoriaService.criar({ nome: "  Bebidas  " });

      expect(Categoria.create).toHaveBeenCalledWith({ nome: "Bebidas" });
      expect(resultado).toEqual(categoriaCriada);
    });

    // BUG DOCUMENTADO: a validação de obrigatoriedade roda sobre o valor
    // bruto do body, antes do trim. Uma string só de espaços passa na
    // validação (!== "") e vira "" depois do trim — a categoria é criada
    // com nome vazio em vez de disparar o erro 400 esperado.
    it("[BUG] cria categoria com nome vazio quando body.nome é só espaços", async () => {
      Categoria.create.mockResolvedValue({ id: 2, nome: "" });

      const resultado = await categoriaService.criar({ nome: "   " });

      expect(Categoria.create).toHaveBeenCalledWith({ nome: "" });
      expect(resultado.nome).toBe("");
      // Comportamento correto seria: rejects.toMatchObject({ statusCode: 400 })
    });

    it("propaga erro do model (ex: violação de constraint) sem tratamento", async () => {
      Categoria.create.mockRejectedValue(new Error("Duplicate entry"));

      await expect(categoriaService.criar({ nome: "Bebidas" })).rejects.toThrow(
        "Duplicate entry",
      );
    });
  });

  describe("atualizar", () => {
    it("lança AppError 400 para id inválido", async () => {
      await expect(
        categoriaService.atualizar("abc", { nome: "X" }),
      ).rejects.toMatchObject({
        message: "ID inválido",
        statusCode: 400,
      });
      expect(Categoria.findById).not.toHaveBeenCalled();
    });

    it("lança AppError 404 quando categoria não existe", async () => {
      Categoria.findById.mockResolvedValue(null);

      await expect(
        categoriaService.atualizar("1", { nome: "X" }),
      ).rejects.toMatchObject({
        message: "Categoria não encontrada",
        statusCode: 404,
      });
      expect(Categoria.update).not.toHaveBeenCalled();
    });

    it("lança AppError 400 quando nenhum campo válido é informado", async () => {
      Categoria.findById.mockResolvedValue({ id: 1, nome: "Bebidas" });

      await expect(categoriaService.atualizar("1", {})).rejects.toMatchObject({
        message: "Nenhum campo válido informado para atualização",
        statusCode: 400,
      });
      expect(Categoria.update).not.toHaveBeenCalled();
    });

    it("lança AppError 400 quando body só tem campos não atualizáveis", async () => {
      Categoria.findById.mockResolvedValue({ id: 1, nome: "Bebidas" });

      await expect(
        categoriaService.atualizar("1", { descricaoIrrelevante: "x" }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("atualiza com nome trimado quando válido", async () => {
      Categoria.findById.mockResolvedValue({ id: 1, nome: "Bebidas" });
      Categoria.update.mockResolvedValue(undefined);

      await categoriaService.atualizar("1", { nome: "  Refrigerantes  " });

      expect(Categoria.update).toHaveBeenCalledWith(1, {
        nome: "Refrigerantes",
      });
    });

    it("[BUG] atualiza para nome vazio quando body.nome é só espaços", async () => {
      Categoria.findById.mockResolvedValue({ id: 1, nome: "Bebidas" });
      Categoria.update.mockResolvedValue(undefined);

      await categoriaService.atualizar("1", { nome: "   " });

      expect(Categoria.update).toHaveBeenCalledWith(1, { nome: "" });
    });
  });

  // ---------------------------------------------------------------------
  // excluir
  // ---------------------------------------------------------------------
  describe("excluir", () => {
    it("lança AppError 400 para id inválido", async () => {
      await expect(categoriaService.excluir("-1")).rejects.toMatchObject({
        message: "ID inválido",
        statusCode: 400,
      });
      expect(Categoria.delete).not.toHaveBeenCalled();
    });

    it("lança AppError 404 quando nenhuma linha é afetada", async () => {
      Categoria.delete.mockResolvedValue({ affectedRows: 0 });

      await expect(categoriaService.excluir("1")).rejects.toMatchObject({
        message: "Categoria não encontrada",
        statusCode: 404,
      });
    });

    it("resolve sem erro quando a exclusão afeta ao menos uma linha", async () => {
      Categoria.delete.mockResolvedValue({ affectedRows: 1 });

      await expect(categoriaService.excluir("1")).resolves.toBeUndefined();
      expect(Categoria.delete).toHaveBeenCalledWith(1);
    });

    it("[FRÁGIL] lança TypeError não tratado se o retorno do model não tiver affectedRows", async () => {
      Categoria.delete.mockResolvedValue(undefined);

      await expect(categoriaService.excluir("1")).rejects.toThrow(TypeError);
    });
  });
});
