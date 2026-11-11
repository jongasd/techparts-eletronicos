jest.mock("../../src/models/produtos");
jest.mock("../../src/utils/imagem");

const Produto = require("../../src/models/produtos");
const imagem = require("../../src/utils/imagem");
const produtoService = require("../../src/services/produtoService");

const bodyValido = {
  id_categoria: 1,
  nome_produto: "Resistor 10k",
  quantidade_estoque: 0,
  quantidade_minima: 5,
  preco: 1.5,
};
const arquivo = { buffer: Buffer.from("conteudo") };

afterEach(() => jest.resetAllMocks());

describe("produtoService.criar com imagem", () => {
  test("sem arquivo: não toca no disco e não envia campo imagem", async () => {
    Produto.create.mockResolvedValue(7);
    await expect(produtoService.criar(bodyValido)).resolves.toBe(7);
    expect(imagem.salvarImagem).not.toHaveBeenCalled();
    expect(Produto.create.mock.calls[0][0]).not.toHaveProperty("imagem");
  });

  test("com arquivo: salva e grava o NOME no banco", async () => {
    imagem.salvarImagem.mockResolvedValue("abc.jpg");
    Produto.create.mockResolvedValue(8);
    await expect(produtoService.criar(bodyValido, arquivo)).resolves.toBe(8);
    expect(imagem.salvarImagem).toHaveBeenCalledWith(arquivo.buffer);
    expect(Produto.create).toHaveBeenCalledWith(expect.objectContaining({ imagem: "abc.jpg" }));
  });

  test("campos inválidos: rejeita ANTES de gravar o arquivo", async () => {
    await expect(produtoService.criar({ nome_produto: "x" }, arquivo)).rejects.toMatchObject({ statusCode: 400 });
    expect(imagem.salvarImagem).not.toHaveBeenCalled();
  });

  test("falha no INSERT: apaga o arquivo recém-gravado", async () => {
    imagem.salvarImagem.mockResolvedValue("abc.jpg");
    Produto.create.mockRejectedValue(new Error("db fora"));
    await expect(produtoService.criar(bodyValido, arquivo)).rejects.toThrow("db fora");
    expect(imagem.removerArquivoImagem).toHaveBeenCalledWith("abc.jpg");
  });

  test("arquivo inválido: erro de salvarImagem sobe e nada é inserido", async () => {
    imagem.salvarImagem.mockRejectedValue(Object.assign(new Error("inválido"), { statusCode: 415 }));
    await expect(produtoService.criar(bodyValido, arquivo)).rejects.toMatchObject({ statusCode: 415 });
    expect(Produto.create).not.toHaveBeenCalled();
  });
});

describe("produtoService.atualizar com imagem", () => {
  test("só imagem, sem outros campos: é válido", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 3, imagem: "velha.jpg" });
    imagem.salvarImagem.mockResolvedValue("nova.png");
    await produtoService.atualizar("3", {}, arquivo);
    expect(Produto.update).toHaveBeenCalledWith(3, { imagem: "nova.png" });
  });

  test("troca: remove a antiga SÓ depois do update", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 3, imagem: "velha.jpg" });
    imagem.salvarImagem.mockResolvedValue("nova.png");
    const ordem = [];
    Produto.update.mockImplementation(async () => ordem.push("update"));
    imagem.removerArquivoImagem.mockImplementation(async () => ordem.push("remove"));
    await produtoService.atualizar("3", { nome_produto: "Novo" }, arquivo);
    expect(ordem).toEqual(["update", "remove"]);
    expect(imagem.removerArquivoImagem).toHaveBeenCalledWith("velha.jpg");
  });

  test("falha no UPDATE: apaga a nova e mantém a antiga", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 3, imagem: "velha.jpg" });
    imagem.salvarImagem.mockResolvedValue("nova.png");
    Produto.update.mockRejectedValue(new Error("db fora"));
    await expect(produtoService.atualizar("3", {}, arquivo)).rejects.toThrow("db fora");
    expect(imagem.removerArquivoImagem).toHaveBeenCalledTimes(1);
    expect(imagem.removerArquivoImagem).toHaveBeenCalledWith("nova.png");
  });

  test("produto inexistente: 404 sem gravar arquivo", async () => {
    Produto.findById.mockResolvedValue(null);
    await expect(produtoService.atualizar("9", {}, arquivo)).rejects.toMatchObject({ statusCode: 404 });
    expect(imagem.salvarImagem).not.toHaveBeenCalled();
  });

  test("sem campos e sem arquivo continua sendo 400", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 3 });
    await expect(produtoService.atualizar("3", {})).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("produtoService.removerImagem", () => {
  test("zera a coluna e apaga o arquivo", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 3, imagem: "a.jpg" });
    await produtoService.removerImagem("3");
    expect(Produto.update).toHaveBeenCalledWith(3, { imagem: null });
    expect(imagem.removerArquivoImagem).toHaveBeenCalledWith("a.jpg");
  });
  test("404 se o produto não existe", async () => {
    Produto.findById.mockResolvedValue(null);
    await expect(produtoService.removerImagem("3")).rejects.toMatchObject({ statusCode: 404 });
  });
  test("404 se o produto não tem imagem", async () => {
    Produto.findById.mockResolvedValue({ id_produto: 3, imagem: null });
    await expect(produtoService.removerImagem("3")).rejects.toMatchObject({ statusCode: 404 });
    expect(Produto.update).not.toHaveBeenCalled();
  });
});
