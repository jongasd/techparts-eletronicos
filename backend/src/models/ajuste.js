const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const Ajuste = {
  findAll: () =>
    executarQuery(`
      SELECT
        a.id_ajuste,
        a.quantidade_ajustada,
        a.tipo_ajuste,
        a.data_ajuste,
        a.motivo,
        p.id_produto,
        p.nome_produto,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_ajuste a
      INNER JOIN tbl_produtos p ON p.id_produto = a.id_produto
      INNER JOIN tbl_funcionario f ON f.id_funcionario = a.id_funcionario
      ORDER BY a.data_ajuste DESC
    `),

  findById: async (id, conn) => {
    const resultado = await executarQuery(
      `
      SELECT
        a.id_ajuste,
        a.quantidade_ajustada,
        a.tipo_ajuste,
        a.data_ajuste,
        a.motivo,
        p.id_produto,
        p.nome_produto,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_ajuste a
      INNER JOIN tbl_produtos p ON p.id_produto = a.id_produto
      INNER JOIN tbl_funcionario f ON f.id_funcionario = a.id_funcionario
      WHERE a.id_ajuste = ?
      `,
      [id],
      conn,
    );
    return resultado[0] ?? null;
  },

  create: async (dados, conn) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_ajuste SET ?",
      [dados],
      conn,
    );
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_ajuste SET ? WHERE id_ajuste = ?", [dados, id]),

  delete: (id) =>
    executarQuery("DELETE FROM tbl_ajuste WHERE id_ajuste = ?", [id]),
};

module.exports = Ajuste;
