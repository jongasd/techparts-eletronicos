const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const AppError = require("./appError");
const {
  DIR_PRODUTOS,
  ROTA_PUBLICA_PRODUTOS,
} = require("../config/upload");

// Nome gerado por nós: uuid + extensão. Qualquer outro formato é recusado
// antes de tocar no disco (evita path traversal se o valor do banco for adulterado).
const NOME_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/**
 * Descobre o tipo REAL pelo conteúdo (magic bytes). O mimetype e a extensão
 * enviados pelo cliente são livremente falsificáveis, então não servem de prova.
 * SVG fica de fora de propósito: pode carregar <script> (XSS armazenado).
 */
const detectarTipo = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
};

const salvarImagem = async (buffer) => {
  const tipo = detectarTipo(buffer);
  if (!tipo) {
    throw new AppError(
      "Arquivo inválido: envie uma imagem JPG, PNG ou WebP",
      415,
    );
  }

  const nome = `${crypto.randomUUID()}.${tipo.ext}`;
  await fs.mkdir(DIR_PRODUTOS, { recursive: true });
  // flag "wx": nunca sobrescreve um arquivo existente
  await fs.writeFile(path.join(DIR_PRODUTOS, nome), buffer, { flag: "wx" });
  return nome;
};

/** Remove o arquivo; nunca lança (imagem órfã não pode derrubar a requisição). */
const removerArquivoImagem = async (nome) => {
  if (!nome || !NOME_VALIDO.test(nome)) return;
  try {
    await fs.unlink(path.join(DIR_PRODUTOS, nome));
  } catch (erro) {
    if (erro.code !== "ENOENT") {
      console.error("[Imagem] falha ao remover arquivo:", erro.message);
    }
  }
};

const urlImagem = (nome) => {
  if (!nome) return null;
  const base = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "");
  return `${base}${ROTA_PUBLICA_PRODUTOS}/${nome}`;
};

module.exports = { detectarTipo, salvarImagem, removerArquivoImagem, urlImagem };
