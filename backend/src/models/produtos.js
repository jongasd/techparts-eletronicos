const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const CAMPOS_PUBLICOS =
  "id_produto, id_categoria, nome_produto, quantidade_estoque, quantidade_minima, localizacao, preco, ativo, criado_em, atualizado_em";

const Produto = {
  // Lista só ativos com suporte a paginação e filtros opcionais (Issue #13)
  findAll: async ({ pagina, limite, busca, id_categoria } = {}) => {
    let sql = `SELECT ${CAMPOS_PUBLICOS} FROM tbl_produtos WHERE ativo = 1`;
    let sqlCount = "SELECT COUNT(*) as total FROM tbl_produtos WHERE ativo = 1";
    const params = [];
    const countParams = [];

    if (busca) {
      sql += " AND nome_produto LIKE ?";
      sqlCount += " AND nome_produto LIKE ?";
      params.push(`%${busca}%`);
      countParams.push(`%${busca}%`);
    }

    if (id_categoria) {
      sql += " AND id_categoria = ?";
      sqlCount += " AND id_categoria = ?";
      params.push(Number(id_categoria));
      countParams.push(Number(id_categoria));
    }

    sql += " ORDER BY nome_produto ASC";

    if (pagina !== undefined && limite !== undefined) {
      const p = Math.max(1, Number(pagina) || 1);
      const l = Math.max(1, Number(limite) || 20);
      const offset = (p - 1) * l;

      sql += " LIMIT ? OFFSET ?";
      params.push(l, offset);

      const [registros, countResult] = await Promise.all([
        executarQuery(sql, params),
        executarQuery(sqlCount, countParams),
      ]);

      const total = countResult[0]?.total || 0;
      return {
        registros,
        total,
        pagina: p,
        limite: l,
        totalPaginas: Math.ceil(total / l),
      };
    }

    return executarQuery(sql, params);
  },

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
