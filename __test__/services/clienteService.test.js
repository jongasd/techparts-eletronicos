jest.mock("../../src/models/cliente");

const Cliente = require("../../src/models/cliente");
const clienteService = require("../../src/services/clienteService");

describe("clienteService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listarTodas", () => {
    test("delega direto para Cliente.findAll", async () => {
      const lista = [{ id_cliente: 1 }, { id_cliente: 2 }];
      Cliente.findAll.mockResolvedValue(lista);

      const resultado = await clienteService.listarTodos();

      expect(Cliente.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(lista);
    });
    describe("buscarPorId", () => {
      test("retorna o produto quando existe", async () => {
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

        await expect(
          clienteService.criar(semNomeCliente),
        ).rejects.toMatchObject({
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
      test("atualizar rejeita ativo fora de 0/1", async () => {
        Cliente.findById.mockResolvedValue({ id_cliente: 1, ativo: 1 });

        await expect(
          clienteService.atualizar("1", { ativo: 5 }),
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(Cliente.update).not.toHaveBeenCalled();
      });
    });
  });
  describe("atualizar", () => {
    test("404 quando cliente não existe", async () => {
      Cliente.findById.mockResolvedValue(null);

      await expect(
        clienteService.atualizar("1", { nome: "Macaco" }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Cliente.update).not.toHaveBeenCalled();
    });
    test("rejeita quando nehnum campo válido é enviado", async () => {
      Cliente.findById.mockResolvedValue({
        id_cliente: 1,
        ativo: 1,
      });
      await expect(
        clienteService.atualizar("1", { ativo: 0, campo_invalido: "x" }),
      ).rejects.toMatchObject({ statusCode:400})
      expect(Cliente.update).not.toHaveBeenCalled()
    });

    test("rejeita campo numérico inválido", async () => {
      Cliente.findById.mockResolvedValue({ id_cliente: 1, ativo:1})
    })
  });
});
