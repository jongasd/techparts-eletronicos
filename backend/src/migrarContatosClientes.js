const pool = require("./config/database");

const COLUNAS = {
  cpf: "VARCHAR(14) NULL",
  telefone: "VARCHAR(20) NULL",
  email: "VARCHAR(255) NULL",
};

async function main() {
  for (const [coluna, definicao] of Object.entries(COLUNAS)) {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'tbl_clientes'
         AND COLUMN_NAME = ?`,
      [coluna],
    );

    if (total === 0) {
      await pool.query(`ALTER TABLE tbl_clientes ADD COLUMN ${coluna} ${definicao}`);
      console.log(`Coluna tbl_clientes.${coluna} criada.`);
    }
  }
}

main()
  .catch((erro) => {
    console.error("Falha na migração de contatos de clientes:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());