const pool = require("../config/database");

const executarQuery = (sql, valores = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, valores, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });

const CAMPOS_PUBLICOS = "id_cliente, nome_cliente, ativo";

const Cliente = {
  findAll: () =>
    executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_clientes ORDER BY nome_cliente ASC`,
    ),

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

  delete: (id) =>
    executarQuery("DELETE FROM tbl_clientes WHERE id_cliente = ?", [id]),
};

module.exports = Cliente;
