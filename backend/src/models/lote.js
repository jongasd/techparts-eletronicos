const pool = require("../config/database");

const loteModel = {
  criar: async (
    conn,
    { id_produto, id_item_entrada, numero_lote, quantidade, data_validade },
  ) => {
    const [result] = await conn.query(
      `INSERT INTO tbl_lote
        (id_produto, id_item_entrada, numero_lote, quantidade_inicial, quantidade_atual, data_validade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_produto,
        id_item_entrada,
        numero_lote ?? null,
        quantidade,
        quantidade,
        data_validade ?? null,
      ],
    );
    return result.insertId;
  },

  // FOR UPDATE trava as linhas retornadas até o commit da transação chamadora.
  buscarLotesDisponiveisParaAtualizacao: async (conn, id_produto) => {
    const [rows] = await conn.query(
      `SELECT * FROM tbl_lote
       WHERE id_produto = ? AND quantidade_atual > 0
       ORDER BY (data_validade IS NULL), data_validade ASC, data_entrada ASC
       FOR UPDATE`,
      [id_produto],
    );
    return rows;
  },

  abaterQuantidade: async (conn, id_lote, quantidade) => {
    await conn.query(
      `UPDATE tbl_lote SET quantidade_atual = quantidade_atual - ? WHERE id_lote = ?`,
      [quantidade, id_lote],
    );
  },

  registrarConsumo: async (conn, id_item_saida, id_lote, quantidade) => {
    await conn.query(
      `INSERT INTO tbl_saida_lote (id_item_saida, id_lote, quantidade) VALUES (?, ?, ?)`,
      [id_item_saida, id_lote, quantidade],
    );
  },

  listarPorProduto: async (id_produto) => {
    const [rows] = await pool.query(
      `SELECT * FROM tbl_lote WHERE id_produto = ? ORDER BY (data_validade IS NULL), data_validade ASC`,
      [id_produto],
    );
    return rows;
  },

  listarVencendo: async (dias) => {
    const [rows] = await pool.query(
      `SELECT l.*, p.nome_produto
       FROM tbl_lote l
       JOIN tbl_produtos p ON p.id_produto = l.id_produto
       WHERE l.quantidade_atual > 0
         AND l.data_validade IS NOT NULL
         AND l.data_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY l.data_validade ASC`,
      [dias],
    );
    return rows;
  },
};

module.exports = loteModel;
