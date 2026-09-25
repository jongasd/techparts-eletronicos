const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const Entrada = {
  findAll: () =>
    executarQuery(`
      SELECT
        e.id_entrada,
        e.data_entrada,
        e.observacao,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_entrada e
      INNER JOIN tbl_funcionario f ON f.id_funcionario = e.id_funcionario
      ORDER BY e.data_entrada DESC
    `),

  findById: async (id) => {
    const resultado = await executarQuery(
      `
      SELECT
        e.id_entrada,
        e.data_entrada,
        e.observacao,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_entrada e
      INNER JOIN tbl_funcionario f ON f.id_funcionario = e.id_funcionario
      WHERE e.id_entrada = ?
      `,
      [id],
    );
    return resultado[0] ?? null;
  },

  findItensByEntrada: (idEntrada) =>
    executarQuery(
      `
      SELECT
        ie.id_item_entrada,
        ie.quantidade,
        ie.valor_unitario,
        p.id_produto,
        p.nome_produto
      FROM tbl_item_entrada ie
      INNER JOIN tbl_produtos p ON p.id_produto = ie.id_produto
      WHERE ie.id_entrada = ?
      `,
      [idEntrada],
    ),

  create: async (dados, conn) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_entrada SET ?",
      [dados],
      conn,
    );
    return resultado.insertId;
  },

  createItem: async (dados, conn) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_item_entrada SET ?",
      [dados],
      conn,
    );
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_entrada SET ? WHERE id_entrada = ?", [dados, id]),

  deleteItensByEntrada: (idEntrada) =>
    executarQuery("DELETE FROM tbl_item_entrada WHERE id_entrada = ?", [
      idEntrada,
    ]),

  delete: (id) =>
    executarQuery("DELETE FROM tbl_entrada WHERE id_entrada = ?", [id]),
};

module.exports = Entrada;
