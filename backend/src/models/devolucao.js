const pool = require("../config/database");

const executarQuery = (sql, valores = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, valores, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });

const Devolucao = {
  findAll: () =>
    executarQuery(`
      SELECT
        d.id_devolucao,
        d.data_devolucao,
        d.motivo,
        d.id_saida,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_devolucao d
      INNER JOIN tbl_funcionario f ON f.id_funcionario = d.id_funcionario
      ORDER BY d.data_devolucao DESC
    `),

  findById: async (id) => {
    const resultado = await executarQuery(
      `
      SELECT
        d.id_devolucao,
        d.data_devolucao,
        d.motivo,
        d.id_saida,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_devolucao d
      INNER JOIN tbl_funcionario f ON f.id_funcionario = d.id_funcionario
      WHERE d.id_devolucao = ?
      `,
      [id],
    );
    return resultado[0] ?? null;
  },

  findItensByDevolucao: (idDevolucao) =>
    executarQuery(
      `
      SELECT
        id2.id_item_devolucao,
        id2.quantidade_devolvida,
        p.id_produto,
        p.nome_produto
      FROM tbl_item_devolucao id2
      INNER JOIN tbl_produtos p ON p.id_produto = id2.id_produto
      WHERE id2.id_devolucao = ?
      `,
      [idDevolucao],
    ),

  create: async (dados) => {
    const resultado = await executarQuery("INSERT INTO tbl_devolucao SET ?", [
      dados,
    ]);
    return resultado.insertId;
  },

  createItem: async (dados) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_item_devolucao SET ?",
      [dados],
    );
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_devolucao SET ? WHERE id_devolucao = ?", [
      dados,
      id,
    ]),

  deleteItensByDevolucao: (idDevolucao) =>
    executarQuery("DELETE FROM tbl_item_devolucao WHERE id_devolucao = ?", [
      idDevolucao,
    ]),

  delete: (id) =>
    executarQuery("DELETE FROM tbl_devolucao WHERE id_devolucao = ?", [id]),
};

module.exports = Devolucao;
