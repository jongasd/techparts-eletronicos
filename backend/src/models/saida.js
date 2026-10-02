const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const Saida = {
  findAll: () =>
    executarQuery(`
      SELECT
        s.id_saida,
        s.data_saida,
        s.observacao,
        s.origem,
        s.total,
        c.id_cliente,
        c.nome_cliente,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_saida s
      INNER JOIN tbl_clientes c ON c.id_cliente = s.id_cliente
      INNER JOIN tbl_funcionario f ON f.id_funcionario = s.id_funcionario
      ORDER BY s.data_saida DESC, s.id_saida DESC
    `),

  findById: async (id, conn) => {
    const resultado = await executarQuery(
      `
      SELECT
        s.id_saida,
        s.data_saida,
        s.observacao,
        s.origem,
        s.desconto,
        s.total,
        s.troco,
        c.id_cliente,
        c.nome_cliente,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_saida s
      INNER JOIN tbl_clientes c ON c.id_cliente = s.id_cliente
      INNER JOIN tbl_funcionario f ON f.id_funcionario = s.id_funcionario
      WHERE s.id_saida = ?
      `,
      [id],
      conn,
    );
    return resultado[0] ?? null;
  },

  findItensBySaida: (idSaida, conn) =>
    executarQuery(
      `
      SELECT
        is2.id_item_saida,
        is2.quantidade,
        is2.preco_unitario,
        p.id_produto,
        p.nome_produto
      FROM tbl_item_saida is2
      INNER JOIN tbl_produtos p ON p.id_produto = is2.id_produto
      WHERE is2.id_saida = ?
      `,
      [idSaida],
      conn,
    ),

  create: async (dados, conn) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_saida SET ?",
      [dados],
      conn,
    );
    return resultado.insertId;
  },

  createItem: async (dados, conn) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_item_saida SET ?",
      [dados],
      conn,
    );
    return resultado.insertId;
  },

  update: (id, dados, conn) =>
    executarQuery(
      "UPDATE tbl_saida SET ? WHERE id_saida = ?",
      [dados, id],
      conn,
    ),

  deleteItensBySaida: (idSaida, conn) =>
    executarQuery(
      "DELETE FROM tbl_item_saida WHERE id_saida = ?",
      [idSaida],
      conn,
    ),

  delete: (id, conn) =>
    executarQuery("DELETE FROM tbl_saida WHERE id_saida = ?", [id], conn),
};

module.exports = Saida;
