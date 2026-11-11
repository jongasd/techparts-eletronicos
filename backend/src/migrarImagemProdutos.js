// Aplica a migration 004 (coluna tbl_produtos.imagem) usando a mesma conexão e
// o mesmo .env da API. Útil quando você não tem o cliente `mysql` à mão
// (ex.: banco gerenciado). Idempotente: pode rodar quantas vezes quiser.
//
//   node src/migrarImagemProdutos.js
const pool = require("./config/database");

async function main() {
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tbl_produtos'
        AND COLUMN_NAME = 'imagem'`,
  );

  if (total > 0) {
    console.log("Coluna tbl_produtos.imagem já existe. Nada a fazer.");
    return;
  }

  await pool.query("ALTER TABLE tbl_produtos ADD COLUMN imagem VARCHAR(255) NULL");
  console.log("Coluna tbl_produtos.imagem criada com sucesso.");
}

main()
  .catch((erro) => {
    console.error("Falha na migração:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
