const pool = require("../config/database");

const executarQuery = (sql, valores = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, valores, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });

const CAMPOS_PUBLICOS = "id_funcionario, nome_funcionario, ativo";

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
