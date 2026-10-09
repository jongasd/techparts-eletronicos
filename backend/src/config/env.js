const path = require("path");

// Mesmo caminho do database.js, para os dois lerem o mesmo .env
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const OBRIGATORIAS = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
];

const PLACEHOLDERS = [
  "secret",
  "changeme",
  "troque",
  "suasenha",
  "senha",
  "jwt_secret",
  "segredo",
  "123456",
];

const faltando = OBRIGATORIAS.filter((v) => !process.env[v]);
if (faltando.length > 0) {
  console.error(`[Config] Variáveis ausentes no .env: ${faltando.join(", ")}`);
  process.exit(1);
}

const segredo = process.env.JWT_SECRET;
if (
  segredo.length < 32 ||
  PLACEHOLDERS.some((p) => segredo.toLowerCase().includes(p))
) {
  console.error(
    "[Config] JWT_SECRET fraco: use ao menos 32 caracteres aleatórios e sem palavras óbvias.",
  );
  process.exit(1);
}

if (!Number.isInteger(Number(process.env.DB_PORT))) {
  console.error("[Config] DB_PORT precisa ser um número inteiro.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN) {
  console.error(
    "[Config] Defina CORS_ORIGIN com a origem do frontend em produção.",
  );
  process.exit(1);
}
