/**
 * Teste HTTP de verdade: sobe o app Express e envia multipart/form-data real
 * (passa pelo multer, pela validação de conteúdo e pelo express.static).
 * Só o model e o auth são simulados — não precisa de MySQL.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "techparts-http-"));
process.env.UPLOAD_DIR = TMP;
process.env.UPLOAD_MAX_MB = "1";

jest.mock("../../src/models/produtos");
jest.mock("../../src/middlewares/auth", () => (req, res, next) => {
  const perms = req.headers["x-perms"];
  req.funcionario = {
    id_funcionario: 1,
    permissoes: perms === undefined ? ["produtos:criar", "produtos:editar", "produtos:visualizar"] : perms.split(",").filter(Boolean),
  };
  next();
});

const Produto = require("../../src/models/produtos");
const app = require("../../src/app");

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const dirProdutos = () => path.join(TMP, "produtos");
const arquivosNoDisco = () => (fs.existsSync(dirProdutos()) ? fs.readdirSync(dirProdutos()) : []);

let server, base;
beforeAll(async () => {
  await new Promise((ok) => { server = app.listen(0, ok); });
  base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(async () => {
  await new Promise((ok) => server.close(ok));
  fs.rmSync(TMP, { recursive: true, force: true });
});
beforeEach(() => {
  jest.resetAllMocks();
  fs.rmSync(dirProdutos(), { recursive: true, force: true });
});

const form = ({ campos = {}, arquivo, nomeCampo = "imagem", tipo = "image/png", nomeArquivo = "foto.png" } = {}) => {
  const fd = new FormData();
  Object.entries(campos).forEach(([k, v]) => fd.append(k, String(v)));
  if (arquivo) fd.append(nomeCampo, new Blob([arquivo], { type: tipo }), nomeArquivo);
  return fd;
};
const campos = { id_categoria: 1, nome_produto: "Capacitor", quantidade_estoque: 0, quantidade_minima: 2, preco: "3.90" };

describe("POST /produtos (multipart)", () => {
  test("201: grava o arquivo, salva só o nome e a imagem fica acessível", async () => {
    Produto.create.mockResolvedValue(10);
    const r = await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: PNG }) });
    expect(r.status).toBe(201);

    const dados = Produto.create.mock.calls[0][0];
    expect(dados.imagem).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(dados.preco).toBe(3.9); // string do form virou número
    expect(arquivosNoDisco()).toEqual([dados.imagem]);

    const img = await fetch(`${base}/uploads/produtos/${dados.imagem}`);
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/png");
    expect(img.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await img.arrayBuffer()).equals(PNG)).toBe(true);
  });

  test("JSON puro (sem imagem) continua funcionando", async () => {
    Produto.create.mockResolvedValue(11);
    const r = await fetch(`${base}/produtos`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(campos) });
    expect(r.status).toBe(201);
    expect(Produto.create.mock.calls[0][0]).not.toHaveProperty("imagem");
  });

  test("415: texto/HTML disfarçado de image/png (mimetype falso)", async () => {
    const r = await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: Buffer.from("<script>alert(1)</script> bastante texto"), nomeArquivo: "x.png" }) });
    expect(r.status).toBe(415);
    expect(Produto.create).not.toHaveBeenCalled();
    expect(arquivosNoDisco()).toEqual([]);
  });

  test("415: SVG declarado como image/svg+xml", async () => {
    const r = await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: Buffer.from("<svg/>"), tipo: "image/svg+xml", nomeArquivo: "x.svg" }) });
    expect(r.status).toBe(415);
    expect(arquivosNoDisco()).toEqual([]);
  });

  test("413: arquivo maior que o limite (1 MB neste teste)", async () => {
    const grande = Buffer.concat([PNG, Buffer.alloc(1024 * 1024 + 10)]);
    const r = await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: grande }) });
    expect(r.status).toBe(413);
    expect(Produto.create).not.toHaveBeenCalled();
    expect(arquivosNoDisco()).toEqual([]);
  });

  test("400: arquivo no campo errado", async () => {
    const r = await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: PNG, nomeCampo: "foto" }) });
    expect(r.status).toBe(400);
  });

  test("400 de validação: arquivo NÃO fica no disco", async () => {
    const r = await fetch(`${base}/produtos`, { method: "POST", body: form({ campos: { nome_produto: "só nome" }, arquivo: PNG }) });
    expect(r.status).toBe(400);
    expect(arquivosNoDisco()).toEqual([]);
  });

  test("403 sem permissão: arquivo não é gravado", async () => {
    const r = await fetch(`${base}/produtos`, { method: "POST", headers: { "x-perms": "produtos:visualizar" }, body: form({ campos, arquivo: PNG }) });
    expect(r.status).toBe(403);
    expect(arquivosNoDisco()).toEqual([]);
  });

  test("falha no banco: arquivo é removido e resposta é 500", async () => {
    Produto.create.mockRejectedValue(new Error("db fora"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const r = await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: PNG }) });
    spy.mockRestore();
    expect(r.status).toBe(500);
    expect(arquivosNoDisco()).toEqual([]);
  });
});

describe("PUT /produtos/:id e DELETE /produtos/:id/imagem", () => {
  test("PUT só com imagem troca o arquivo e apaga o antigo", async () => {
    // cria o "arquivo antigo" via POST para ter um nome válido de verdade
    Produto.create.mockResolvedValue(1);
    await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: PNG }) });
    const antigo = Produto.create.mock.calls[0][0].imagem;

    Produto.findById.mockResolvedValue({ id_produto: 1, imagem: antigo });
    Produto.update.mockResolvedValue({});
    const r = await fetch(`${base}/produtos/1`, { method: "PUT", body: form({ arquivo: PNG }) });
    expect(r.status).toBe(200);

    const novo = Produto.update.mock.calls[0][1].imagem;
    expect(novo).not.toBe(antigo);
    expect(arquivosNoDisco()).toEqual([novo]);
  });

  test("GET /produtos/:id devolve imagem_url", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 1, nome_produto: "x", imagem: "a.jpg" });
    const r = await fetch(`${base}/produtos/1`);
    const j = await r.json();
    expect(j.dados.imagem_url).toBe("/uploads/produtos/a.jpg");
  });

  test("GET /produtos/:id sem imagem devolve imagem_url null", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 1, nome_produto: "x", imagem: null });
    const j = await (await fetch(`${base}/produtos/1`)).json();
    expect(j.dados.imagem_url).toBeNull();
  });

  test("DELETE /:id/imagem remove arquivo e zera a coluna", async () => {
    Produto.create.mockResolvedValue(1);
    await fetch(`${base}/produtos`, { method: "POST", body: form({ campos, arquivo: PNG }) });
    const nome = Produto.create.mock.calls[0][0].imagem;

    Produto.findById.mockResolvedValue({ id_produto: 1, imagem: nome });
    Produto.update.mockResolvedValue({});
    const r = await fetch(`${base}/produtos/1/imagem`, { method: "DELETE" });
    expect(r.status).toBe(200);
    expect(Produto.update).toHaveBeenCalledWith(1, { imagem: null });
    expect(arquivosNoDisco()).toEqual([]);
  });

  test("/uploads não lista diretório nem vaza arquivos fora da pasta", async () => {
    expect((await fetch(`${base}/uploads/produtos/`)).status).toBe(404);
    expect((await fetch(`${base}/uploads/produtos/..%2f..%2fpackage.json`)).status).toBeGreaterThanOrEqual(400);
  });
});
