// controllers/dashboardController.js
const db = require("../config/database.js"); // ajuste pro seu módulo de conexão

exports.getResumo = async (req, res, next) => {
  try {
    const [[totais]] = await db.query(`
      SELECT
        COUNT(*) AS total_produtos_ativos,
        COALESCE(SUM(quantidade_estoque * preco), 0) AS valor_total_estoque,
        SUM(CASE WHEN quantidade_estoque < quantidade_minima THEN 1 ELSE 0 END) AS produtos_abaixo_minimo
      FROM tbl_produtos
      WHERE ativo = 1
    `);

    const [movimentacoesHoje] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM tbl_entrada WHERE data_entrada = CURDATE()) AS entradas_hoje,
        (SELECT COUNT(*) FROM tbl_saida WHERE data_saida = CURDATE()) AS saidas_hoje
    `);

    res.json({
      total_produtos_ativos: totais.total_produtos_ativos,
      valor_total_estoque: totais.valor_total_estoque,
      produtos_abaixo_minimo: totais.produtos_abaixo_minimo,
      entradas_hoje: movimentacoesHoje[0].entradas_hoje,
      saidas_hoje: movimentacoesHoje[0].saidas_hoje,
    });
  } catch (err) {
    next(err);
  }
};

exports.getProdutosPorCategoria = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT c.nome AS categoria, COUNT(p.id_produto) AS total
      FROM tbl_categorias c
      LEFT JOIN tbl_produtos p ON p.id_categoria = c.id_categoria AND p.ativo = 1
      GROUP BY c.id_categoria, c.nome
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getMovimentacoes7dias = async (req, res, next) => {
  try {
    const [entradas] = await db.query(`
      SELECT data_entrada AS data, COUNT(*) AS total
      FROM tbl_entrada
      WHERE data_entrada >= CURDATE() - INTERVAL 6 DAY
      GROUP BY data_entrada
    `);
    const [saidas] = await db.query(`
      SELECT data_saida AS data, COUNT(*) AS total
      FROM tbl_saida
      WHERE data_saida >= CURDATE() - INTERVAL 6 DAY
      GROUP BY data_saida
    `);
    res.json({ entradas, saidas });
  } catch (err) {
    next(err);
  }
};

exports.getProdutosAbaixoMinimo = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT id_produto, nome_produto, quantidade_estoque, quantidade_minima
      FROM tbl_produtos
      WHERE ativo = 1 AND quantidade_estoque < quantidade_minima
      ORDER BY (quantidade_minima - quantidade_estoque) DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};