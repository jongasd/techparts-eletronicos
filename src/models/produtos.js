const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const CAMPOS_PUBLICOS =
  "id_produto, id_categoria, nome_produto, quantidade_estoque, quantidade_minima, localizacao, preco, ativo, criado_em, atualizado_em";

const Produto = {
  findAll: () =>
    executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_produtos ORDER BY nome_produto ASC`,
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

  delete: (id) =>
    executarQuery("DELETE FROM tbl_produtos WHERE id_produto = ?", [id]),

  // Incremento é sempre seguro (não tem como ficar negativo), não precisa de checagem.
  incrementarEstoque: (idProduto, quantidade, conn) =>
    executarQuery(
      "UPDATE tbl_produtos SET quantidade_estoque = quantidade_estoque + ? WHERE id_produto = ?",
      [quantidade, idProduto],
      conn,
    ),

  // Decremento atômico: a condição quantidade_estoque >= ? vai dentro do WHERE,
  // então o lock de linha da própria UPDATE resolve concorrência sem SELECT prévio.
  // Retorna false se não havia saldo suficiente (affectedRows = 0), sem lançar erro —
  // quem chama decide o que fazer (AppError, rollback, etc).
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
