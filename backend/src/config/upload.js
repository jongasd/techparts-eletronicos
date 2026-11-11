const path = require("path");

// Onde as imagens ficam gravadas. Em produção (Render, Railway, Fly...) o disco
// do container é EFÊMERO: a cada deploy/restart o que não estiver em um volume
// persistente é apagado. Aponte UPLOAD_DIR para o ponto de montagem do volume.
const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
);

const DIR_PRODUTOS = path.join(UPLOAD_DIR, "produtos");
const ROTA_PUBLICA_PRODUTOS = "/uploads/produtos";

const limiteMb = Number(process.env.UPLOAD_MAX_MB);
const MAX_MB = Number.isFinite(limiteMb) && limiteMb > 0 ? limiteMb : 2;

module.exports = {
  UPLOAD_DIR,
  DIR_PRODUTOS,
  ROTA_PUBLICA_PRODUTOS,
  MAX_MB,
  MAX_BYTES: Math.floor(MAX_MB * 1024 * 1024),
};
