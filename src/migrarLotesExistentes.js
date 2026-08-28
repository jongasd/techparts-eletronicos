const pool = require("../src/config/database");

async function main() {
  const conn = await pool.getConnection();
  try {
    // idempotência: se já existe alguma entrada de migração, não roda de novo.
    // Sem isso, rodar o script duas vezes duplica o estoque de todo produto.
    const [existente] = await conn.query(
      `SELECT id_entrada FROM tbl_entrada WHERE observacao = 'MIGRACAO_LOTES_INICIAL' LIMIT 1`,
    );
    if (existente.length > 0) {
      console.log(
        "Migração já executada anteriormente (id_entrada =",
        existente[0].id_entrada,
        "). Abortando.",
      );
      return;
    }

    const [[admin]] = await conn.query(
      `SELECT id_funcionario FROM tbl_funcionario WHERE login = 'admin' LIMIT 1`,
    );
    if (!admin) {
      throw new Error(
        "Funcionário 'admin' não encontrado — ajuste o login usado na migração.",
      );
    }

    await conn.beginTransaction();

    const [entradaResult] = await conn.query(
      `INSERT INTO tbl_entrada (id_funcionario, data_entrada, observacao)
       VALUES (?, CURDATE(), 'MIGRACAO_LOTES_INICIAL')`,
      [admin.id_funcionario],
    );
    const idEntrada = entradaResult.insertId;

    const [produtos] = await conn.query(
      `SELECT id_produto, quantidade_estoque, preco FROM tbl_produtos WHERE quantidade_estoque > 0`,
    );

    for (const produto of produtos) {
      const [itemResult] = await conn.query(
        `INSERT INTO tbl_item_entrada (id_entrada, id_produto, quantidade, valor_unitario)
         VALUES (?, ?, ?, ?)`,
        [
          idEntrada,
          produto.id_produto,
          produto.quantidade_estoque,
          produto.preco,
        ],
      );

      await conn.query(
        `INSERT INTO tbl_lote
          (id_produto, id_item_entrada, numero_lote, quantidade_inicial, quantidade_atual, data_validade)
         VALUES (?, ?, 'MIGRACAO', ?, ?, NULL)`,
        [
          produto.id_produto,
          itemResult.insertId,
          produto.quantidade_estoque,
          produto.quantidade_estoque,
        ],
      );
    }

    await conn.commit();
    console.log(
      `Migração concluída: ${produtos.length} produto(s) receberam lote inicial.`,
    );
  } catch (erro) {
    await conn.rollback();
    console.error("Falha na migração:", erro.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

main();
