jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../src/models/funcionario");
jest.mock("../../src/config/database");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Funcionario = require("../../src/models/funcionario");
const pool = require("../../src/config/database");
const authService = require("../../src/services/authService");

// Ajuste os paths dos require acima (models/config) pra bater com a
// estrutura real do projeto se for diferente.

describe("authService", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: "segredo-de-teste" };
    pool.query = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  describe("login", () => {
    test("rejeita quando falta login ou senha, sem consultar o banco", async () => {
      await expect(authService.login("", "123")).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(authService.login("joao", "")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.findByLoginComSenha).not.toHaveBeenCalled();
    });

    test("faz trim do login antes de buscar", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue(null);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login("  joao  ", "senha123"),
      ).rejects.toMatchObject({ statusCode: 401 });

      expect(Funcionario.findByLoginComSenha).toHaveBeenCalledWith("joao");
    });

    test("login inexistente ainda assim chama bcrypt.compare (mitigação de timing)", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue(null);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login("joao", "senha123")).rejects.toMatchObject(
        { statusCode: 401 },
      );

      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      // não compara contra undefined/null — usa o hash placeholder
      const hashUsado = bcrypt.compare.mock.calls[0][1];
      expect(typeof hashUsado).toBe("string");
      expect(hashUsado.length).toBeGreaterThan(0);
    });

    test("funcionário inativo rejeita mesmo com senha certa", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue({
        id_funcionario: 1,
        ativo: 0,
        senha_hash: "hash-qualquer",
      });
      bcrypt.compare.mockResolvedValue(true);

      await expect(authService.login("joao", "senha123")).rejects.toMatchObject(
        { statusCode: 401 },
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test("senha errada rejeita", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue({
        id_funcionario: 1,
        ativo: 1,
        senha_hash: "hash-real",
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login("joao", "senhaErrada"),
      ).rejects.toMatchObject({ statusCode: 401 });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test("login bem-sucedido retorna token e dados do funcionário", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue({
        id_funcionario: 1,
        nome_funcionario: "Jonas",
        login: "joao",
        ativo: 1,
        senha_hash: "hash-real",
        id_role: 2,
      });
      bcrypt.compare.mockResolvedValue(true);
      pool.query.mockResolvedValue([
        [
          { recurso: "produtos", acao: "criar" },
          { recurso: "produtos", acao: "visualizar" },
        ],
      ]);
      jwt.sign.mockReturnValue("token-fake");

      const resultado = await authService.login("joao", "senha123");

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id_funcionario: 1,
          login: "joao",
          id_role: 2,
          permissoes: ["produtos:criar", "produtos:visualizar"],
        }),
        "segredo-de-teste",
        expect.objectContaining({ expiresIn: "8h" }),
      );
      expect(resultado).toEqual({
        token: "token-fake",
        funcionario: {
          id_funcionario: 1,
          nome_funcionario: "Jonas",
          login: "joao",
        },
      });
    });
  });

  describe("registrar", () => {
    const bodyValido = (overrides = {}) => ({
      nome_funcionario: "Jonas",
      login: "joao",
      senha: "senha1234",
      id_role: 2,
      ...overrides,
    });

    test("rejeita quando falta campo obrigatório", async () => {
      const { id_role, ...semRole } = bodyValido();

      await expect(authService.registrar(semRole)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.findByLoginComSenha).not.toHaveBeenCalled();
    });

    test("rejeita nome_funcionario só com espaços", async () => {
      const body = bodyValido({ nome_funcionario: "   " });

      await expect(authService.registrar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.findByLoginComSenha).not.toHaveBeenCalled();
    });

    test("rejeita login só com espaços", async () => {
      const body = bodyValido({ login: "   " });

      await expect(authService.registrar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.findByLoginComSenha).not.toHaveBeenCalled();
    });

    test("rejeita senha curta", async () => {
      const body = bodyValido({ senha: "123" });

      await expect(authService.registrar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.findByLoginComSenha).not.toHaveBeenCalled();
    });

    test("rejeita id_role inválido", async () => {
      const body = bodyValido({ id_role: "abc" });

      await expect(authService.registrar(body)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Funcionario.findByLoginComSenha).not.toHaveBeenCalled();
    });

    test("rejeita quando login já existe", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue({ id_funcionario: 1 });

      await expect(authService.registrar(bodyValido())).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(Funcionario.create).not.toHaveBeenCalled();
    });

    test("faz trim do login antes de checar duplicidade e de criar", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hash-gerado");
      Funcionario.create.mockResolvedValue(10);

      await authService.registrar(bodyValido({ login: "  joao  " }));

      expect(Funcionario.findByLoginComSenha).toHaveBeenCalledWith("joao");
      expect(Funcionario.create).toHaveBeenCalledWith(
        expect.objectContaining({ login: "joao" }),
      );
    });

    test("cria funcionário com sucesso: hash, trims e ativo=1", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hash-gerado");
      Funcionario.create.mockResolvedValue(10);

      const id = await authService.registrar(
        bodyValido({ nome_funcionario: "  Jonas  " }),
      );

      expect(bcrypt.hash).toHaveBeenCalledWith("senha1234", 10);
      expect(Funcionario.create).toHaveBeenCalledWith({
        nome_funcionario: "Jonas",
        login: "joao",
        senha_hash: "hash-gerado",
        id_role: 2,
        ativo: 1,
      });
      expect(id).toBe(10);
    });

    test("corrida: create falha com chave duplicada vira 409", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hash-gerado");
      const erroDuplicado = new Error("Duplicate entry");
      erroDuplicado.code = "ER_DUP_ENTRY";
      Funcionario.create.mockRejectedValue(erroDuplicado);

      await expect(authService.registrar(bodyValido())).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    test("erro inesperado no create não é mascarado como 409", async () => {
      Funcionario.findByLoginComSenha.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hash-gerado");
      const erroQualquer = new Error("conexão perdida");
      Funcionario.create.mockRejectedValue(erroQualquer);

      await expect(authService.registrar(bodyValido())).rejects.toThrow(
        "conexão perdida",
      );
    });
  });

  describe("trocarSenha", () => {
    const ID = 1;

    test("rejeita quando falta senha_atual ou senha_nova", async () => {
      await expect(
        authService.trocarSenha(ID, { senha_atual: "", senha_nova: "nova1234" }),
      ).rejects.toMatchObject({ statusCode: 400 });

      await expect(
        authService.trocarSenha(ID, { senha_atual: "antiga1234", senha_nova: "" }),
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(pool.query).not.toHaveBeenCalled();
    });

    test("rejeita nova senha com menos de 8 caracteres", async () => {
      await expect(
        authService.trocarSenha(ID, { senha_atual: "antiga1234", senha_nova: "curta" }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("rejeita quando senha_nova === senha_atual", async () => {
      await expect(
        authService.trocarSenha(ID, { senha_atual: "mesma1234", senha_nova: "mesma1234" }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("404 quando funcionario não encontrado", async () => {
      pool.query.mockResolvedValue([[]]); // rows vazio

      await expect(
        authService.trocarSenha(ID, { senha_atual: "antiga1234", senha_nova: "nova1234!" }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test("401 quando senha atual está incorreta", async () => {
      pool.query.mockResolvedValue([[{ senha_hash: "hash-real" }]]);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.trocarSenha(ID, { senha_atual: "errada123", senha_nova: "nova1234!" }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    test("atualiza hash quando tudo está correto", async () => {
      pool.query
        .mockResolvedValueOnce([[{ senha_hash: "hash-antigo" }]]) // SELECT
        .mockResolvedValueOnce([{ affectedRows: 1 }]);            // UPDATE
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("hash-novo");

      await authService.trocarSenha(ID, {
        senha_atual: "antiga1234",
        senha_nova: "nova1234!",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("nova1234!", 10);
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining("UPDATE tbl_funcionario SET senha_hash"),
        ["hash-novo", ID],
      );
    });
  });
});
