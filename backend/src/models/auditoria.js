const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const Auditoria = {
  create: async ({ id_funcionario, acao, recurso, id_recurso, detalhes, ip }, conn = pool) => {
    try {
      const sql = `
        INSERT INTO tbl_log_auditoria 
          (id_funcionario, acao, recurso, id_recurso, detalhes, ip)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const valores = [
        id_funcionario || null,
        acao,
        recurso,
        id_recurso ? String(id_recurso) : null,
        detalhes ? JSON.stringify(detalhes) : null,
        ip || null,
      ];
      const resultado = await executarQuery(sql, valores, conn);
      return resultado.insertId;
    } catch (err) {
      // Falha no log de auditoria não deve derrubar a requisição principal
      console.error("[Auditoria ERROR]:", err.message);
      return null;
    }
  },

  findAll: async ({ pagina, limite, acao, recurso } = {}) => {
    let sql = `
      SELECT 
        l.id_log,
        l.acao,
        l.recurso,
        l.id_recurso,
        l.detalhes,
        l.ip,
        l.criado_em,
        f.id_funcionario,
        f.nome_funcionario
      FROM tbl_log_auditoria l
      LEFT JOIN tbl_funcionario f ON f.id_funcionario = l.id_funcionario
      WHERE 1=1
    `;
    let sqlCount = "SELECT COUNT(*) as total FROM tbl_log_auditoria WHERE 1=1";
    const params = [];
    const countParams = [];

    if (acao) {
      sql += " AND l.acao = ?";
      sqlCount += " AND acao = ?";
      params.push(acao);
      countParams.push(acao);
    }

    if (recurso) {
      sql += " AND l.recurso = ?";
      sqlCount += " AND recurso = ?";
      params.push(recurso);
      countParams.push(recurso);
    }

    sql += " ORDER BY l.criado_em DESC, l.id_log DESC";

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
};

module.exports = Auditoria;
