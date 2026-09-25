jest.mock("../../src/models/produtos");

const Produto = require("../../src/models/produtos");
const produtoService = require("../../src/services/produtoService");

describe("produtoService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listarTodas", () => {
    test("delega direto pra Produto.findAll", async () => {
      const lista = [{ id_produto: 1 }, { id_produto: 2 }];
      Produto.findAll.mockResolvedValue(lista);

      const resultado = await produtoService.listarTodas();

      expect(Produto.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(lista);
    });
  });

  describe("buscarPorId", () => {
    test("retorna o produto quando existe", async () => {
      const produto = { id_produto: 5, nome_produto: "Cabo HDMI" };
      Produto.findById.mockResolvedValue(produto);

      const resultado = await produtoService.buscarPorId("5");

      expect(Produto.findById).toHaveBeenCalledWith(5);
      expect(resultado).toBe(produto);
    });

    test("rejeita id inválido sem chamar o banco", async () => {
      await expect(produtoService.buscarPorId("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Produto.findById).not.toHaveBeenCalled();
    });

    test("rejeita id <= 0", async () => {
      await expect(produtoService.buscarPorId("0")).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(produtoService.buscarPorId("-3")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("404 quando não encontrado", async () => {
      Produto.findById.mockResolvedValue(null);

      await expect(produtoService.buscarPorId("99")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("criar", () => {
    const bodyValido = () => ({
      id_categoria: "2",
      nome_produto: "  Resistor 10k  ",
      quantidade_estoque: "100",
      quantidade_minima: "10",
      preco: "0.50",
    });

    test("rejeita quando falta campo obrigatório", async () => {
      const { preco, ...semPreco } = bodyValido();

      await expect(produtoService.criar(semPreco)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Produto.create).not.toHaveBeenCalled();
    });

    test("rejeita campo numérico inválido (NaN)", async () => {
      const body = { ...bodyValido(), preco: "não é número" };

      await expect(produtoService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Produto.create).not.toHaveBeenCalled();
    });

    test("rejeita ativo fora de 0/1", async () => {
      const body = { ...bodyValido(), ativo: 2 };

      await expect(produtoService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Produto.create).not.toHaveBeenCalled();
    });

    test("aplica ativo=1 por default quando não informado", async () => {
      Produto.create.mockResolvedValue(42);

      const id = await produtoService.criar(bodyValido());

      expect(Produto.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: 1 }),
      );
      expect(id).toBe(42);
    });

    test("aceita ativo=0 explícito", async () => {
      Produto.create.mockResolvedValue(43);

      await produtoService.criar({ ...bodyValido(), ativo: "0" });

      expect(Produto.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: 0 }),
      );
    });

    test("converte tipos e faz trim no texto antes de gravar", async () => {
      Produto.create.mockResolvedValue(44);

      await produtoService.criar(bodyValido());

      expect(Produto.create).toHaveBeenCalledWith({
        id_categoria: 2,
        nome_produto: "Resistor 10k",
        quantidade_estoque: 100,
        quantidade_minima: 10,
        localizacao: null,
        preco: 0.5,
        ativo: 1,
      });
    });
  });

  describe("atualizar", () => {
    test("404 quando produto não existe", async () => {
      Produto.findById.mockResolvedValue(null);

      await expect(
        produtoService.atualizar("1", { preco: "10" }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Produto.update).not.toHaveBeenCalled();
    });

    test("rejeita quando nenhum campo válido é enviado", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 1 });

      await expect(
        produtoService.atualizar("1", { ativo: 0, campo_invalido: "x" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Produto.update).not.toHaveBeenCalled();
    });

    test("rejeita campo numérico inválido", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 1 });

      await expect(
        produtoService.atualizar("1", { preco: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Produto.update).not.toHaveBeenCalled();
    });

    test("atualiza só os campos válidos, convertendo tipos", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 1 });
      Produto.update.mockResolvedValue({ affectedRows: 1 });

      await produtoService.atualizar("1", {
        preco: "12.90",
        localizacao: "  Prateleira 3  ",
        campo_invalido: "ignorado",
      });

      expect(Produto.update).toHaveBeenCalledWith(1, {
        preco: 12.9,
        localizacao: "Prateleira 3",
      });
    });

    test("ignora campos vazios ('') sem quebrar", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 1 });
      Produto.update.mockResolvedValue({ affectedRows: 1 });

      await produtoService.atualizar("1", { preco: "5", localizacao: "" });

      expect(Produto.update).toHaveBeenCalledWith(1, { preco: 5 });
    });
  });

  describe("desativar", () => {
    test("404 quando produto não existe", async () => {
      Produto.findById.mockResolvedValue(null);

      await expect(produtoService.desativar("1")).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(Produto.desativar).not.toHaveBeenCalled();
    });

    test("rejeita se já está desativado", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 0 });

      await expect(produtoService.desativar("1")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Produto.desativar).not.toHaveBeenCalled();
    });

    test("desativa produto ativo", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 1 });

      await produtoService.desativar("1");

      expect(Produto.desativar).toHaveBeenCalledWith(1);
    });
  });

  describe("ativar", () => {
    test("404 quando produto não existe", async () => {
      Produto.findById.mockResolvedValue(null);

      await expect(produtoService.ativar("1")).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(Produto.ativar).not.toHaveBeenCalled();
    });

    test("rejeita se já está ativo", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 1 });

      await expect(produtoService.ativar("1")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Produto.ativar).not.toHaveBeenCalled();
    });

    test("ativa produto desativado", async () => {
      Produto.findById.mockResolvedValue({ id_produto: 1, ativo: 0 });

      await produtoService.ativar("1");

      expect(Produto.ativar).toHaveBeenCalledWith(1);
    });
  });
});
