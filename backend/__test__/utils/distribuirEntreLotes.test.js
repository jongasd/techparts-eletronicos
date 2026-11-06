const distribuirEntreLotes = require("../../src/utils/distribuirEntreLotes");

const consumos = [
  { id_saida_lote: 1, id_lote: 100, quantidade: 3 },
  { id_saida_lote: 2, id_lote: 101, quantidade: 2 },
];

describe("distribuirEntreLotes", () => {
  it("devolve primeiro ao lote que foi consumido primeiro", () => {
    expect(distribuirEntreLotes(consumos, 0, 2)).toEqual({
      alocacoes: [{ id_lote: 100, quantidade: 2 }],
      naoRastreado: 0,
    });
  });

  it("transborda para o próximo lote quando o primeiro já recebeu tudo o que deu", () => {
    expect(distribuirEntreLotes(consumos, 0, 4)).toEqual({
      alocacoes: [
        { id_lote: 100, quantidade: 3 },
        { id_lote: 101, quantidade: 1 },
      ],
      naoRastreado: 0,
    });
  });

  it("pula o que devoluções anteriores já repuseram", () => {
    expect(distribuirEntreLotes(consumos, 3, 2)).toEqual({
      alocacoes: [{ id_lote: 101, quantidade: 2 }],
      naoRastreado: 0,
    });
    expect(distribuirEntreLotes(consumos, 4, 1)).toEqual({
      alocacoes: [{ id_lote: 101, quantidade: 1 }],
      naoRastreado: 0,
    });
  });

  it("nunca devolve a um lote mais do que ele forneceu (soma das alocações por lote)", () => {
    const { alocacoes } = distribuirEntreLotes(consumos, 1, 4);
    const porLote = {};
    alocacoes.forEach((a) => {
      porLote[a.id_lote] = (porLote[a.id_lote] ?? 0) + a.quantidade;
    });
    expect(porLote[100]).toBeLessThanOrEqual(3);
    expect(porLote[101]).toBeLessThanOrEqual(2);
    expect(Object.values(porLote).reduce((s, q) => s + q, 0)).toBe(4);
  });

  it("trata o mesmo lote aparecendo em duas linhas de consumo", () => {
    const repetido = [
      { id_saida_lote: 1, id_lote: 100, quantidade: 2 },
      { id_saida_lote: 2, id_lote: 100, quantidade: 2 },
    ];
    const { alocacoes, naoRastreado } = distribuirEntreLotes(repetido, 1, 3);
    expect(alocacoes.reduce((s, a) => s + a.quantidade, 0)).toBe(3);
    expect(naoRastreado).toBe(0);
  });

  it("informa a parte sem lote registrado (saída anterior ao controle de lotes)", () => {
    expect(distribuirEntreLotes([], 0, 3)).toEqual({
      alocacoes: [],
      naoRastreado: 3,
    });
    expect(distribuirEntreLotes(consumos, 0, 7)).toMatchObject({
      naoRastreado: 2,
    });
  });
});
