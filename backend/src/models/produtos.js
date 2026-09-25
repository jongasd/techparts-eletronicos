const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const CAMPOS_PUBLICOS =
  "id_produto, id_categoria, nome_produto, quantidade_estoque, quantidade_minima, localizacao, preco, ativo, criado_em, atualizado_em";

const Produto = {
  // Lista só ativos — é o que qualquer tela normal do sistema deve consumir.
  findAll: () =>
    executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_produtos WHERE ativo = 1 ORDER BY nome_produto ASC`,
    ),

  findById: async (id, conn) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_produtos WHERE id_produto = ?`,
      [id],
      conn,
    );
    return resultado[0] ?? null;
  },

  findByLocalization: async (localizacao) => {
    const resultado = await executarQuery(
      "SELECT * FROM tbl_produtos WHERE localizacao = ?",
      [localizacao],
    );
    return resultado[0] ?? null;
  },

  findByName: async (name) => {
    const resultado = await executarQuery(
      "SELECT * FROM tbl_produtos WHERE nome_produto = ?",
      [name],
    );
    return resultado[0] ?? null;
  },

  create: async (dados) => {
    const resultado = await executarQuery("INSERT INTO tbl_produtos SET ?", [
      dados,
    ]);
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_produtos SET ? WHERE id_produto = ?", [
      dados,
      id,
    ]),

  desativar: (id) =>
    executarQuery("UPDATE tbl_produtos SET ativo = 0 WHERE id_produto = ?", [
      id,
    ]),

  ativar: (id) =>
    executarQuery("UPDATE tbl_produtos SET ativo = 1 WHERE id_produto = ?", [
      id,
    ]),

  incrementarEstoque: (idProduto, quantidade, conn) =>
    executarQuery(
      "UPDATE tbl_produtos SET quantidade_estoque = quantidade_estoque + ? WHERE id_produto = ?",
      [quantidade, idProduto],
      conn,
    ),

  decrementarEstoque: async (idProduto, quantidade, conn) => {
    const resultado = await executarQuery(
      "UPDATE tbl_produtos SET quantidade_estoque = quantidade_estoque - ? WHERE id_produto = ? AND quantidade_estoque >= ?",
      [quantidade, idProduto, quantidade],
      conn,
    );
    return resultado.affectedRows > 0;
  },
};

module.exports = Produto;
