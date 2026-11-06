const pool = require("../config/database");

// pool já é o pool de promises (config/database exporta pool.promise()).
// Não passe callback aqui: o callback é ignorado e a chamada nunca resolve.
const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

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
      ORDER BY d.data_devolucao DESC, d.id_devolucao DESC
    `),

  findById: async (id, conn) => {
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
      conn,
    );
    return resultado[0] ?? null;
  },

  findItensByDevolucao: (idDevolucao, conn) =>
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
      conn,
    ),

  create: async (dados, conn) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_devolucao SET ?",
      [dados],
      conn,
    );
    return resultado.insertId;
  },

  createItem: async (dados, conn) => {
    const resultado = await executarQuery(
      "INSERT INTO tbl_item_devolucao SET ?",
      [dados],
      conn,
    );
    return resultado.insertId;
  },

  update: (id, dados, conn) =>
    executarQuery(
      "UPDATE tbl_devolucao SET ? WHERE id_devolucao = ?",
      [dados, id],
      conn,
    ),

  // --- consultas usadas pela devolução com reposição de estoque/lote ---

  // Trava a linha da saída até o commit: duas devoluções da mesma saída
  // passam a ser serializadas, então o teto "vendido - já devolvido" não
  // pode ser furado por requisições simultâneas.
  travarSaida: async (idSaida, conn) => {
    const rows = await executarQuery(
      "SELECT id_saida FROM tbl_saida WHERE id_saida = ? FOR UPDATE",
      [idSaida],
      conn,
    );
    return rows[0] ?? null;
  },

  somarVendidoPorProduto: (idSaida, conn) =>
    executarQuery(
      `SELECT id_produto, SUM(quantidade) AS total
       FROM tbl_item_saida
       WHERE id_saida = ?
       GROUP BY id_produto`,
      [idSaida],
      conn,
    ),

  somarDevolvidoPorProduto: (idSaida, conn) =>
    executarQuery(
      `SELECT idv.id_produto, SUM(idv.quantidade_devolvida) AS total
       FROM tbl_item_devolucao idv
       INNER JOIN tbl_devolucao d ON d.id_devolucao = idv.id_devolucao
       WHERE d.id_saida = ?
       GROUP BY idv.id_produto`,
      [idSaida],
      conn,
    ),

  // Quanto cada lote forneceu a esta saída para o produto, em ordem estável.
  // A ordem precisa ser a mesma em toda chamada: é ela que define em quais
  // lotes as devoluções anteriores já foram devolvidas.
  listarConsumoDeLotes: (idSaida, idProduto, conn) =>
    executarQuery(
      `SELECT sl.id_saida_lote, sl.id_lote, sl.quantidade
       FROM tbl_saida_lote sl
       INNER JOIN tbl_item_saida i ON i.id_item_saida = sl.id_item_saida
       WHERE i.id_saida = ? AND i.id_produto = ?
       ORDER BY sl.id_saida_lote`,
      [idSaida, idProduto],
      conn,
    ),
};

module.exports = Devolucao;
