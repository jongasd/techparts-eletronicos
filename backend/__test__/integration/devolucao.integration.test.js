/**
 * Teste de integração da devolução contra um MySQL/MariaDB REAL.
 *
 * Não roda no `npx jest` normal. Para rodar:
 *   1. crie um banco de teste (schema + src/migrations/002_pdv.sql) com nome
 *      terminando em _test, ex.: db_techparts_test
 *   2. RUN_DB_TESTS=1 DB_NAME=db_techparts_test npx jest __test__/integration
 *
 * A trava no nome do banco existe para este teste nunca escrever no banco de
 * desenvolvimento ou de produção.
 */
const habilitado =
  process.env.RUN_DB_TESTS === "1" &&
  String(process.env.DB_NAME || "").endsWith("_test");

const suite = habilitado ? describe : describe.skip;

suite("devolução com reposição de estoque e lotes (banco real)", () => {
  let pool;
  let saidaService;
  let devolucaoService;
  let contador = 0;

  beforeAll(() => {
    pool = require("../../src/config/database");
    saidaService = require("../../src/services/saidaService");
    devolucaoService = require("../../src/services/devolucaoService");
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  // Produto novo por teste: os testes não dependem uns dos outros.
  const semearProduto = async (lotes) => {
    contador += 1;
    const total = lotes.reduce((s, l) => s + l.qtd, 0);
    const [[cat]] = await pool.query(
      "SELECT id_categoria FROM tbl_categorias LIMIT 1",
    );
    let idCategoria = cat?.id_categoria;
    if (!idCategoria) {
      const [r] = await pool.query(
        "INSERT INTO tbl_categorias (nome) VALUES ('Teste')",
      );
      idCategoria = r.insertId;
    }
    const [p] = await pool.query(
      "INSERT INTO tbl_produtos (id_categoria, nome_produto, quantidade_estoque, preco) VALUES (?, ?, ?, 10.00)",
      [idCategoria, `Produto teste ${Date.now()}-${contador}`, total],
    );
    const [e] = await pool.query(
      "INSERT INTO tbl_entrada (id_funcionario, data_entrada) VALUES (1, '2026-01-01')",
    );
    const [ie] = await pool.query(
      "INSERT INTO tbl_item_entrada (id_entrada, id_produto, quantidade, valor_unitario) VALUES (?, ?, ?, 1.00)",
      [e.insertId, p.insertId, total],
    );
    const idsLotes = [];
    for (const l of lotes) {
      const [r] = await pool.query(
        `INSERT INTO tbl_lote (id_produto, id_item_entrada, quantidade_inicial, quantidade_atual, data_validade)
         VALUES (?, ?, ?, ?, ?)`,
        [p.insertId, ie.insertId, l.qtd, l.qtd, l.validade],
      );
      idsLotes.push(r.insertId);
    }
    return { idProduto: p.insertId, idsLotes };
  };

  const vender = (idProduto, quantidade) =>
    saidaService.criar({
      id_cliente: 1,
      id_funcionario: 1,
      data_saida: "2026-10-16",
      itens: [{ id_produto: idProduto, quantidade }],
    });

  const devolver = (idSaida, itens) =>
    devolucaoService.criar({
      id_saida: idSaida,
      id_funcionario: 1,
      data_devolucao: "2026-10-16",
      motivo: "teste",
      itens,
    });

  const estado = async (idProduto, idsLotes) => {
    const [[p]] = await pool.query(
      "SELECT quantidade_estoque FROM tbl_produtos WHERE id_produto = ?",
      [idProduto],
    );
    const [lotes] = await pool.query(
      "SELECT id_lote, quantidade_atual FROM tbl_lote WHERE id_produto = ? ORDER BY id_lote",
      [idProduto],
    );
    const porLote = idsLotes.map(
      (id) => lotes.find((l) => l.id_lote === id).quantidade_atual,
    );
    const somaLotes = porLote.reduce((s, q) => s + q, 0);
    return { estoque: p.quantidade_estoque, porLote, somaLotes };
  };

  const contarDevolucoes = async (idSaida) => {
    const [[r]] = await pool.query(
      "SELECT COUNT(*) AS n FROM tbl_devolucao WHERE id_saida = ?",
      [idSaida],
    );
    return r.n;
  };

  it("devolve ao(s) mesmo(s) lote(s) de origem e mantém estoque == soma dos lotes", async () => {
    // lote A (vence antes, 3 un) e B (10 un): vender 5 consome A(3) + B(2)
    const { idProduto, idsLotes } = await semearProduto([
      { qtd: 3, validade: "2027-01-01" },
      { qtd: 10, validade: "2027-06-01" },
    ]);
    const idSaida = await vender(idProduto, 5);
    expect(await estado(idProduto, idsLotes)).toEqual({
      estoque: 8,
      porLote: [0, 8],
      somaLotes: 8,
    });

    await devolver(idSaida, [
      { id_produto: idProduto, quantidade_devolvida: 4 },
    ]);

    // 4 devolvidas: A recebe 3 (tudo que deu) e B recebe 1
    expect(await estado(idProduto, idsLotes)).toEqual({
      estoque: 12,
      porLote: [3, 9],
      somaLotes: 12,
    });

    // a devolução seguinte continua de onde a anterior parou (B recebe a última)
    await devolver(idSaida, [
      { id_produto: idProduto, quantidade_devolvida: 1 },
    ]);
    expect(await estado(idProduto, idsLotes)).toEqual({
      estoque: 13,
      porLote: [3, 10],
      somaLotes: 13,
    });
  });

  it("recusa devolver mais do que foi vendido (somando devoluções anteriores) e não altera nada", async () => {
    const { idProduto, idsLotes } = await semearProduto([
      { qtd: 10, validade: "2027-01-01" },
    ]);
    const idSaida = await vender(idProduto, 5);
    await devolver(idSaida, [
      { id_produto: idProduto, quantidade_devolvida: 5 },
    ]);
    const antes = await estado(idProduto, idsLotes);
    const devsAntes = await contarDevolucoes(idSaida);

    await expect(
      devolver(idSaida, [{ id_produto: idProduto, quantidade_devolvida: 1 }]),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(await estado(idProduto, idsLotes)).toEqual(antes);
    expect(await contarDevolucoes(idSaida)).toBe(devsAntes);
  });

  it("recusa produto que não faz parte da saída", async () => {
    const a = await semearProduto([{ qtd: 5, validade: "2027-01-01" }]);
    const b = await semearProduto([{ qtd: 5, validade: "2027-01-01" }]);
    const idSaida = await vender(a.idProduto, 2);

    await expect(
      devolver(idSaida, [{ id_produto: b.idProduto, quantidade_devolvida: 1 }]),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect((await estado(b.idProduto, b.idsLotes)).estoque).toBe(5);
  });

  it("é atômica: se um item falha, nada do pedido é gravado (nem o item que estava ok)", async () => {
    const a = await semearProduto([{ qtd: 10, validade: "2027-01-01" }]);
    const b = await semearProduto([{ qtd: 10, validade: "2027-01-01" }]);
    const idSaida = await saidaService.criar({
      id_cliente: 1,
      id_funcionario: 1,
      data_saida: "2026-10-16",
      itens: [
        { id_produto: a.idProduto, quantidade: 4 },
        { id_produto: b.idProduto, quantidade: 4 },
      ],
    });
    const antesA = await estado(a.idProduto, a.idsLotes);
    const antesB = await estado(b.idProduto, b.idsLotes);

    await expect(
      devolver(idSaida, [
        { id_produto: a.idProduto, quantidade_devolvida: 2 }, // ok
        { id_produto: b.idProduto, quantidade_devolvida: 99 }, // excede
      ]),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(await estado(a.idProduto, a.idsLotes)).toEqual(antesA);
    expect(await estado(b.idProduto, b.idsLotes)).toEqual(antesB);
    expect(await contarDevolucoes(idSaida)).toBe(0);
  });

  it("soma itens repetidos do mesmo produto antes de aplicar o teto", async () => {
    const { idProduto, idsLotes } = await semearProduto([
      { qtd: 10, validade: "2027-01-01" },
    ]);
    const idSaida = await vender(idProduto, 5);

    await expect(
      devolver(idSaida, [
        { id_produto: idProduto, quantidade_devolvida: 3 },
        { id_produto: idProduto, quantidade_devolvida: 3 }, // 6 > 5 vendidas
      ]),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect((await estado(idProduto, idsLotes)).estoque).toBe(5);
  });

  it("duas devoluções simultâneas da mesma saída: só uma passa, estoque coerente", async () => {
    const { idProduto, idsLotes } = await semearProduto([
      { qtd: 10, validade: "2027-01-01" },
    ]);
    const idSaida = await vender(idProduto, 5); // estoque 5

    const resultados = await Promise.allSettled([
      devolver(idSaida, [{ id_produto: idProduto, quantidade_devolvida: 3 }]),
      devolver(idSaida, [{ id_produto: idProduto, quantidade_devolvida: 3 }]),
    ]);

    const ok = resultados.filter((r) => r.status === "fulfilled");
    const falhas = resultados.filter((r) => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(falhas).toHaveLength(1);
    expect(falhas[0].reason.statusCode).toBe(409);

    const e = await estado(idProduto, idsLotes);
    expect(e.estoque).toBe(8); // 5 + 3, não 5 + 6
    expect(e.somaLotes).toBe(8);
  });

  it("saída sem lote registrado (anterior à migração) é recusada com 409, sem criar lote nem mexer no estoque", async () => {
    const { idProduto, idsLotes } = await semearProduto([
      { qtd: 10, validade: "2027-01-01" },
    ]);
    // saída "legada": item_saida sem nenhuma linha em tbl_saida_lote
    const [s] = await pool.query(
      "INSERT INTO tbl_saida (id_cliente, id_funcionario, data_saida) VALUES (1, 1, '2026-01-01')",
    );
    await pool.query(
      "INSERT INTO tbl_item_saida (id_saida, id_produto, quantidade) VALUES (?, ?, 3)",
      [s.insertId, idProduto],
    );
    const antes = await estado(idProduto, idsLotes);

    await expect(
      devolver(s.insertId, [
        { id_produto: idProduto, quantidade_devolvida: 1 },
      ]),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(await estado(idProduto, idsLotes)).toEqual(antes);
    const [[n]] = await pool.query(
      "SELECT COUNT(*) AS n FROM tbl_lote WHERE id_produto = ?",
      [idProduto],
    );
    expect(n.n).toBe(1);
  });

  it("saída inexistente devolve 404", async () => {
    await expect(
      devolver(999999999, [{ id_produto: 1, quantidade_devolvida: 1 }]),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("o login consulta id_role (sem ele o token sai com permissoes vazias e toda rota dá 403)", async () => {
    const Funcionario = require("../../src/models/funcionario");
    const admin = await Funcionario.findByLoginComSenha("admin");
    expect(admin).toBeTruthy();
    expect(admin.id_role).toEqual(expect.any(Number));
  });
});
