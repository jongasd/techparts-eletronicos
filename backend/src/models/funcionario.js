const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const CAMPOS_PUBLICOS = "id_funcionario, nome_funcionario, login, ativo";

const Funcionario = {
  findAll: () =>
    executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_funcionario ORDER BY nome_funcionario ASC`,
    ),

  findById: async (id) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_funcionario WHERE id_funcionario = ?`,
      [id],
    );
    return resultado[0] ?? null;
  },

  findByName: async (nome) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_funcionario WHERE nome_funcionario = ?`,
      [nome],
    );
    return resultado[0] ?? null;
  },

  // Único método que retorna senha_hash — nunca expor isso em resposta HTTP.
  // Usado só internamente pelo authService pra comparar a senha no login.
  findByLoginComSenha: async (login) => {
    const resultado = await executarQuery(
      "SELECT id_funcionario, nome_funcionario, login, senha_hash, ativo FROM tbl_funcionario WHERE login = ?",
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

  delete: (id) =>
    executarQuery("DELETE FROM tbl_funcionario WHERE id_funcionario = ?", [id]),
};

module.exports = Funcionario;
