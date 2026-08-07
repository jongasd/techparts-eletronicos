const pool = require("../config/database");

const executarQuery = (sql, valores = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, valores, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });

const CAMPOS_PUBLICOS =
  "id_produto, id_categoria, nome_produto, quantidade_estoque, quantidade_minima, localizacao, preco, ativo, criado_em, atualizado_em";

const Produto = {
  findAll: () =>
    executarQuery(`SELECT ${CAMPOS_PUBLICOS} FROM tbl_produtos ORDER BY nome_produto ASC`),
  findById: async (id) => {
    const resultado = await executarQuery(
      `SELECT ${CAMPOS_PUBLICOS} FROM tbl_produtos WHERE id_produto = ?`,
      [id],
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
      [name ],
    );
    return resultado[0] ?? null;
  },
  
  create: async (dados) => {
    const resultado = await executarQuery("INSERT INTO tbl_produtos SET ?", [dados]);
    return resultado.insertId;
  },

  update: (id, dados) =>
    executarQuery("UPDATE tbl_produtos SET ? WHERE id_produto = ?", [dados, id]),

  delete: (id) => executarQuery("DELETE FROM tbl_produtos WHERE id_produto = ?", [id]),
};

module.exports = Produto;
