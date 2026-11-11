const fs = require("fs");
const os = require("os");
const path = require("path");

// precisa vir ANTES do require do módulo: config/upload lê o env ao carregar
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "techparts-img-"));
process.env.UPLOAD_DIR = TMP;

const {
  detectarTipo,
  salvarImagem,
  removerArquivoImagem,
  urlImagem,
} = require("../../src/utils/imagem");

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.alloc(4),
  Buffer.from("WEBP"),
  Buffer.alloc(16),
]);

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));

describe("detectarTipo (magic bytes)", () => {
  test.each([
    ["jpeg", JPEG, "jpg"],
    ["png", PNG, "png"],
    ["webp", WEBP, "webp"],
  ])("reconhece %s", (_, buf, ext) => {
    expect(detectarTipo(buf).ext).toBe(ext);
  });

  test("recusa SVG, GIF, HTML e lixo, mesmo que o cliente diga que é imagem", () => {
    expect(detectarTipo(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(detectarTipo(Buffer.from("GIF89a" + "x".repeat(20)))).toBeNull();
    expect(detectarTipo(Buffer.from("<script>alert(1)</script>"))).toBeNull();
    expect(detectarTipo(Buffer.alloc(0))).toBeNull();
    expect(detectarTipo(null)).toBeNull();
  });

  test("RIFF que não é WEBP (ex.: WAV) é recusado", () => {
    const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVE"), Buffer.alloc(16)]);
    expect(detectarTipo(wav)).toBeNull();
  });
});

describe("salvarImagem / removerArquivoImagem", () => {
  test("grava com nome uuid + extensão pelo conteúdo real", async () => {
    const nome = await salvarImagem(PNG);
    expect(nome).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(fs.existsSync(path.join(TMP, "produtos", nome))).toBe(true);
  });

  test("conteúdo inválido lança 415 e não cria arquivo", async () => {
    const antes = fs.existsSync(path.join(TMP, "produtos"))
      ? fs.readdirSync(path.join(TMP, "produtos")).length
      : 0;
    await expect(salvarImagem(Buffer.from("não sou imagem, mas tenho mais de 12 bytes"))).rejects.toMatchObject({ statusCode: 415 });
    const depois = fs.readdirSync(path.join(TMP, "produtos")).length;
    expect(depois).toBe(antes);
  });

  test("remove o arquivo; remover de novo (ENOENT) não lança", async () => {
    const nome = await salvarImagem(JPEG);
    await removerArquivoImagem(nome);
    expect(fs.existsSync(path.join(TMP, "produtos", nome))).toBe(false);
    await expect(removerArquivoImagem(nome)).resolves.toBeUndefined();
  });

  test("não aceita path traversal vindo do banco", async () => {
    const alvo = path.join(TMP, "intocavel.txt");
    fs.writeFileSync(alvo, "x");
    await removerArquivoImagem("../intocavel.txt");
    await removerArquivoImagem("../../etc/passwd");
    await removerArquivoImagem(null);
    expect(fs.existsSync(alvo)).toBe(true);
  });
});

describe("urlImagem", () => {
  afterEach(() => delete process.env.PUBLIC_API_URL);

  test("null quando não há imagem", () => {
    expect(urlImagem(null)).toBeNull();
  });
  test("relativa por padrão", () => {
    expect(urlImagem("a.jpg")).toBe("/uploads/produtos/a.jpg");
  });
  test("usa PUBLIC_API_URL sem barra duplicada", () => {
    process.env.PUBLIC_API_URL = "https://api.exemplo.com/";
    expect(urlImagem("a.jpg")).toBe("https://api.exemplo.com/uploads/produtos/a.jpg");
  });
});
