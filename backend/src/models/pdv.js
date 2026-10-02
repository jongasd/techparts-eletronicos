const pool = require("../config/database");

const executarQuery = async (sql, valores = [], conn = pool) => {
  const [resultado] = await conn.query(sql, valores);
  return resultado;
};

const PDV = {
  // Produtos vendáveis: ativos e com saldo. Busca por código de barras exato
  // ou por parte do nome.
  buscarProdutos: (termo, limite = 20) =>
    executarQuery(
      `SELECT id_produto, nome_produto, codigo_barras, preco, quantidade_estoque
         FROM tbl_produtos
        WHERE ativo = 1
          AND quantidade_estoque > 0
          AND (codigo_barras = ? OR nome_produto LIKE ?)
        ORDER BY nome_produto ASC
        LIMIT ?`,
      [termo, `%${termo}%`, limite],
    ),

  idConsumidorFinal: async (conn) => {
    const r = await executarQuery(
      "SELECT id_cliente FROM tbl_clientes WHERE nome_cliente = 'Consumidor final' AND ativo = 1 LIMIT 1",
      [],
      conn,
    );
    return r[0]?.id_cliente ?? null;
  },

  clienteAtivo: async (idCliente, conn) => {
    const r = await executarQuery(
      "SELECT id_cliente FROM tbl_clientes WHERE id_cliente = ? AND ativo = 1",
      [idCliente],
      conn,
    );
    return r.length > 0;
  },

  criarPagamento: async (dados, conn) => {
    const r = await executarQuery("INSERT INTO tbl_pagamento SET ?", [dados], conn);
    return r.insertId;
  },

  findPagamentosBySaida: (idSaida, conn) =>
    executarQuery(
      "SELECT id_pagamento, forma, valor FROM tbl_pagamento WHERE id_saida = ?",
      [idSaida],
      conn,
    ),
};

module.exports = PDV;
