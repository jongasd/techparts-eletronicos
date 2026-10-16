const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const CAMPOS_PUBLICOS = "id_cliente, nome_cliente, ativo";

const Cliente = {
  findAll: async ({ pagina, limite, busca } = {}) => {
    let sql = `SELECT ${CAMPOS_PUBLICOS} FROM tbl_clientes WHERE ativo = 1`;
    let sqlCount = "SELECT COUNT(*) as total FROM tbl_clientes WHERE ativo = 1";
    const params = [];
    const countParams = [];

    if (busca) {
      sql += " AND nome_cliente LIKE ?";
      sqlCount += " AND nome_cliente LIKE ?";
      params.push(`%${busca}%`);
      countParams.push(`%${busca}%`);
    }

    sql += " ORDER BY nome_cliente ASC";

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

  findById: async (id) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_clientes WHERE id_cliente = ?`,
      [id],
    );
    return resultado[0] ?? null;
  },

  findByName: async (nome) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_clientes WHERE nome_cliente = ?`,
      [nome],
    );
    return resultado[0] ?? null;
  },

  create: async (dados) => {
    const resultado = await executarQuery("INSERT INTO tbl_clientes SET ?", [
      dados,
    ]);
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_clientes SET ? WHERE id_cliente = ?", [
      dados,
      id,
    ]),

  // Mantido para uso interno; no fluxo normal da API, use deactivate().
  delete: (id) =>
    executarQuery("DELETE FROM tbl_clientes WHERE id_cliente = ?", [id]),

  deactivate: (id) =>
    executarQuery(
      "UPDATE tbl_clientes SET ativo = 0 WHERE id_cliente = ?",
      [id],
    ),
};

module.exports = Cliente;
