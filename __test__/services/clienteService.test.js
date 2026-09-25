jest.mock("../../src/models/cliente");

const Cliente = require("../../src/models/cliente");
const clienteService = require("../../src/services/clienteService");

describe("clienteService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listarTodos", () => {
    test("delega direto para Cliente.findAll", async () => {
      const lista = [{ id_cliente: 1 }, { id_cliente: 2 }];
      Cliente.findAll.mockResolvedValue(lista);

      const resultado = await clienteService.listarTodos();

      expect(Cliente.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(lista);
    });
  });

  describe("buscarPorId", () => {
    test("retorna o cliente quando existe", async () => {
      const cliente = { id_cliente: 1, nome_cliente: "Jonas" };
      Cliente.findById.mockResolvedValue(cliente);

      const resultado = await clienteService.buscarPorId("1");

      expect(Cliente.findById).toHaveBeenCalledWith(1);
      expect(resultado).toBe(cliente);
    });

    test("rejeita id inválido sem chamar o banco", async () => {
      await expect(clienteService.buscarPorId("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Cliente.findById).not.toHaveBeenCalled();
    });

    test("rejeita id <= 0", async () => {
      await expect(clienteService.buscarPorId("0")).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(clienteService.buscarPorId("-3")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test("404 quando não encontrado", async () => {
      Cliente.findById.mockResolvedValue(null);

      await expect(clienteService.buscarPorId("99")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("criar", () => {
    const bodyValido = () => ({
      nome_cliente: "Jesus Ezequiel Marcolongo dos Santos Lopes",
    });

    test("rejeita quando falta campo obrigatório", async () => {
      const { nome_cliente, ...semNomeCliente } = bodyValido();

      await expect(clienteService.criar(semNomeCliente)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Cliente.create).not.toHaveBeenCalled();
    });

    test("rejeita ativo fora de 0/1", async () => {
      const body = { ...bodyValido(), ativo: 2 };

      await expect(clienteService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Cliente.create).not.toHaveBeenCalled();
    });

    test("aplica ativo=1 por default quando não informado", async () => {
      Cliente.create.mockResolvedValue(42);

      const id = await clienteService.criar(bodyValido());

      expect(Cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: 1 }),
      );
      expect(id).toBe(42);
    });

    test("aceita ativo=0 explícito", async () => {
      Cliente.create.mockResolvedValue(43);

      await clienteService.criar({ ...bodyValido(), ativo: "0" });

      expect(Cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: 0 }),
      );
    });

    test("converte tipos e faz trim no texto antes de gravar", async () => {
      Cliente.create.mockResolvedValue(44);

      await clienteService.criar(bodyValido());

      expect(Cliente.create).toHaveBeenCalledWith({
        nome_cliente: "Jesus Ezequiel Marcolongo dos Santos Lopes",
        ativo: 1,
      });
    });
  });

  describe("atualizar", () => {
    test("404 quando cliente não existe", async () => {
      Cliente.findById.mockResolvedValue(null);

      await expect(
        clienteService.atualizar("1", { nome_cliente: "Macaco" }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Cliente.update).not.toHaveBeenCalled();
    });

    test("rejeita quando nenhum campo válido é enviado", async () => {
      Cliente.findById.mockResolvedValue({ id_cliente: 1, ativo: 1 });

      // só campo inexistente no CAMPOS_ATUALIZAVEIS — nada sobra
      await expect(
        clienteService.atualizar("1", { campo_invalido: "x" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Cliente.update).not.toHaveBeenCalled();
    });

    test("rejeita ativo fora de 0/1", async () => {
      Cliente.findById.mockResolvedValue({ id_cliente: 1, ativo: 1 });

      await expect(
        clienteService.atualizar("1", { ativo: 5 }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Cliente.update).not.toHaveBeenCalled();
    });

    test("rejeita ativo não numérico", async () => {
      Cliente.findById.mockResolvedValue({ id_cliente: 1, ativo: 1 });

      await expect(
        clienteService.atualizar("1", { ativo: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Cliente.update).not.toHaveBeenCalled();
    });

    test("atualiza só os campos válidos, convertendo tipos", async () => {
      Cliente.findById.mockResolvedValue({ id_cliente: 1, ativo: 1 });
      Cliente.update.mockResolvedValue({ affectedRows: 1 });

      await clienteService.atualizar("1", {
        nome_cliente: "  Marcos  ",
        ativo: "0",
        campo_invalido: "ignorado",
      });

      expect(Cliente.update).toHaveBeenCalledWith(1, {
        nome_cliente: "Marcos",
        ativo: 0,
      });
    });

    test("ignora campo vazio ('') sem quebrar", async () => {
      Cliente.findById.mockResolvedValue({ id_cliente: 1, ativo: 1 });
      Cliente.update.mockResolvedValue({ affectedRows: 1 });

      await clienteService.atualizar("1", {
        nome_cliente: "",
        ativo: "1",
      });

      expect(Cliente.update).toHaveBeenCalledWith(1, { ativo: 1 });
    });
  });
});
