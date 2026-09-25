jest.mock("../../src/models/funcionario.js");

const Funcionario = require("../../src/models/funcionario");
const funcionarioService = "../../src/services";

describe("funcionarioService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listarTodos", () => {
    test("delega direto para Funcionario.findAll", async () => {
      const lista = [{ id_funcionario: 1 }, { id_funcionario: 2 }];
      Funcionario.findAll.mockResolvedValue(lista);

      const resultado = await funcionarioService.listarTodos();
      expect(Funcionario.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(lista);
    });
  });

  describe("buscarPorId", () => {
    test("retorna o funcionario quando existe", async () => {
      const funcionario = { id_funcionario: 1, nome_funcionario: "Sofia" };
      Funcionario.findById.mockResolvedValue(funcionario);
      const resultado = await funcionarioService.buscarPorId("1");

      expect(Funcionario.findById).toHaveBeenCalledWith(1);
      expect(resultado).toBe(funcionario);
    });

    test("rejeita id inválido sem chamar o banco", async () => {
      await expect(funcionarioService.buscarPorId("abc")).rejects.toMatchObject(
        { statusCode: 400 },
      );
      expect(Funcionario.findById).not.toHaveBeenCalled();
    });
    test("rejeita id <= 0", async () => {
      await expect(funcionarioService.buscarPorId("0")).rejects.toMatchObject({
        statusCode: 400,
      });

      await expect(funcionarioService.buscarPorId("-3")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
    test("404 quando não encontrado", async () => {
      Funcionario.findById.mockResolvedValue(null);

      await expect(funcionarioService.buscarPorId("99")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("criar", () => {
    const bodyValido = () => ({
      nome_cliente: "Jesus Ezequiel Marcolongo dos Santos Lopes",
    });

    test("rejeita quando falta campo obrigatório", async () => {
      const { nome_funcionario, ...semNomeFuncionario } = bodyValido();

      await expect(
        funcionarioService.criar(semNomeFuncionario),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.create).not.toHaveBeenCalled();
    });

    test("rejeita ativo fora de 0/1", async () => {
      const body = { ...bodyValido(), ativo: 2 };
      await expect(funcionarioService.criar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.create).not.toHaveBeenCalled();
    });

    test("aplica ativo=1 por default quando não informado", async () => {
      Funcionario.create.mockResolvedValue(42);

      const id = await funcionarioService.criar(bodyValido());

      expect(Funcionario.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: 1 }),
      );
      expect(id).toBe(42);
    });
    test("aceita ativo=0 explícito", async () => {
      Funcionario.create.mockResolvedValue(43);

      await funcionarioService.criar({ ...bodyValido(), ativo: "0" });

      expect(Funcionario.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: 0 }),
      );
    });

    test("converte tipos e faz trim no texto antes de gravar", async () => {
      Funcionario.create.mockResolvedValue(44);
      await funcionarioService.criar(bodyValido());

      expect(Funcionario.create).toHaveBeenCalledWith({
        nome_funcionario: "Jesus Ezequiel Marcolongo dos Santos Lopes",
        ativo: 1,
      });
    });
  });

  describe("atualizar", () => {
    test("404 quando o funcionario não existe", async () => {
      Funcionario.findById.mockResolvedValue(null);
      await expect(
        funcionarioService.atualizar("1", { nome_funcionario: "Jonas" }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Funcionario.update).not.toHaveBeenCalled();
    });

    test("rejeita quando nenhum campo válido é enviado", async () => {
      Funcionario.findById.mockResolvedValue({ id_funcionario: 1, ativo: 1 });

      await expect(
        funcionarioService.atualizar("1", { campo_invalido: "x" }),
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(Funcionario.update).not.toHaveBeenCalled();
    });

    test("rejeita ativo fora de 0/1", async () => {
      Funcionario.findById.mockResolvedValue({ id_funcionario: 1, ativo: 1 });

      await expect(
        funcionarioService.atualizar("1", { ativo: 5 }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
    test("rejeita ativo não numérico", async () => {
      Funcionario.findById.mockResolvedValue({ id_funcionario: 1, ativo: 1 });
      await expect(
        funcionarioService.atualizar("1", { ativo: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Funcionario.update).toHaveBeenCalled();
    });

    test("atualiza só os campos válidos, convertendo tipos", async () => {
      Funcionario.findById.mockResolvedValue({ id_funcionario: 1, ativo: 1 });
      Funcionario.update.mockResolvedValue({ affectedRows: 1 });

      await expect(
        funcionarioService.atualizar("1", { ativo: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Funcionario.update).not.toHaveBeenCalled();
    });
    test("atualiza só os campos válidos, convertendo tipos", async () => {
      Funcionario.findById.mockResolvedValue({ id_funcionario: 1, ativo: 1 });
      Funcionario.update.mockResolvedValue({ affectedRows: 1 });
      await funcionarioService.atualizar("1", {
        nome_funcionario: "Marcos",
        ativo: "0",
        campo_invalido: "ignorado",
      });
      expect(Funcionario.update).toHaveBeenCalledWith(1, {
        nome_funcionario: "marcos",
        ativo: 0,
      });
      expect(Funcionario.update).toHaveBeenCalledWith(1, {
        nome_funcionario: "Marcos",
        ativo: 0,
      })
    });
    test("ignora campo vazio ('') sem quebrar", async () => {
        Funcionario.findById.mockResolvedValue({id_funcionario: 1, ativo: 1})
        Funcionario.update.mockResolvedValue({ affectedRows: 1})

        await funcionarioService.atualizar("1", {
            nome_cliente: "",
            ativo: "1",
        })
        expect(Funcionario.update).toHaveBeenCalledWith(1, {ativo: 1})
    })
  });
});
