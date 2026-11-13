const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const CAMPOS_PUBLICOS =
  "f.id_funcionario, f.nome_funcionario, f.login, f.ativo, f.id_role, r.nome_role";
const FROM_PUBLICO =
  "FROM tbl_funcionario f INNER JOIN tbl_roles r ON r.id_role = f.id_role";

const Funcionario = {
  findAll: () =>
    executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_PUBLICO} ORDER BY f.nome_funcionario ASC`,
    ),

  findById: async (id) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_PUBLICO} WHERE f.id_funcionario = ?`,
      [id],
    );
    return resultado[0] ?? null;
  },

  findByName: async (nome) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} ${FROM_PUBLICO} WHERE f.nome_funcionario = ?`,
      [nome],
    );
    return resultado[0] ?? null;
  },

  // Único método que retorna senha_hash — nunca expor isso em resposta HTTP.
  // Usado só internamente pelo authService pra comparar a senha no login.
  findByLoginComSenha: async (login) => {
    const resultado = await executarQuery(
      `SELECT f.id_funcionario, f.nome_funcionario, f.login, f.senha_hash,
              f.ativo, f.id_role, r.nome_role
       FROM tbl_funcionario f
       INNER JOIN tbl_roles r ON r.id_role = f.id_role
       WHERE f.login = ?`,
      [login],
    );
    return resultado[0] ?? null;
  },

  create: async (dados) => {
    const resultado = await executarQuery("INSERT INTO tbl_funcionario SET ?", [
      dados,
    ]);
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_funcionario SET ? WHERE id_funcionario = ?", [
      dados,
      id,
    ]),

  // Mantido para uso interno (ex: cascade eventual ou admin DB).
  // No fluxo normal da API, use deactivate().
  delete: (id) =>
    executarQuery("DELETE FROM tbl_funcionario WHERE id_funcionario = ?", [id]),

  deactivate: (id) =>
    executarQuery(
      "UPDATE tbl_funcionario SET ativo = 0 WHERE id_funcionario = ?",
      [id],
    ),
};

module.exports = Funcionario;
