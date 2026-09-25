const pool = require("../config/database");

const executarQuery = (sql, valores = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, valores, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });

const CAMPOS_PUBLICOS = "id_categoria, nome";

const Categoria = {
  findAll: () =>
    executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_categorias ORDER BY nome ASC`,
    ),

  findById: async (id) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_categorias WHERE id_categoria = ?`,
      [id],
    );
    return resultado[0] ?? null;
  },

  findByName: async (nome) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_categorias WHERE nome = ?`,
      [nome],
    );
    return resultado[0] ?? null;
  },

  create: async (dados) => {
    const resultado = await executarQuery("INSERT INTO tbl_categorias SET ?", [
      dados,
    ]);
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_categorias SET ? WHERE id_categoria = ?", [
      dados,
      id,
    ]),

  delete: (id) =>
    executarQuery("DELETE FROM tbl_categorias WHERE id_categoria = ?", [id]),
};

module.exports = Categoria;
