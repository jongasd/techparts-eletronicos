const pool = require("../config/database");

const executarQuery = (sql, valores = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, valores, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });

const Saida = {
  findAll: () =>
    executarQuery(`
      SELECT
        s.id_saida,
        s.data_saida,
        s.observacao,
        c.id_cliente,
        c.nome_cliente,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_saida s
      INNER JOIN tbl_clientes c ON c.id_cliente = s.id_cliente
      INNER JOIN tbl_funcionario f ON f.id_funcionario = s.id_funcionario
      ORDER BY s.data_saida DESC
    `),

  findById: async (id) => {
    const resultado = await executarQuery(
      `
      SELECT
        s.id_saida,
        s.data_saida,
        s.observacao,
        c.id_cliente,
        c.nome_cliente,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_saida s
      INNER JOIN tbl_clientes c ON c.id_cliente = s.id_cliente
      INNER JOIN tbl_funcionario f ON f.id_funcionario = s.id_funcionario
      WHERE s.id_saida = ?
      `,
      [id]
    );
    return resultado[0] ?? null;
  },

  findItensBySaida: (idSaida) =>
    executarQuery(
      `
      SELECT
        is2.id_item_saida,
        is2.quantidade,
        p.id_produto,
        p.nome_produto
      FROM tbl_item_saida is2
      INNER JOIN tbl_produtos p ON p.id_produto = is2.id_produto
      WHERE is2.id_saida = ?
      `,
      [idSaida]
    ),

  create: async (dados) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_saida SET ?",
      [dados]
    );
    return resultado.insertId;
  },

  createItem: async (dados) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_item_saida SET ?",
      [dados]
    );
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery(
      "UPDATE tbl_saida SET ? WHERE id_saida = ?",
      [dados, id]
    ),

  deleteItensBySaida: (idSaida) =>
    executarQuery(
      "DELETE FROM tbl_item_saida WHERE id_saida = ?",
      [idSaida]
    ),

  delete: (id) =>
    executarQuery(
      "DELETE FROM tbl_saida WHERE id_saida = ?",
      [id]
    ),
};

module.exports = Saida;