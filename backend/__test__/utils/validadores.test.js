const {
  parseId,
  parseNumero,
  parseData,
  parseAtivo,
  validarCamposObrigatorios,
} = require("../../src/utils/validadores");

describe("utils/validadores", () => {
  describe("parseId", () => {
    test("aceita inteiro positivo como string ou number", () => {
      expect(parseId("10")).toBe(10);
      expect(parseId(5)).toBe(5);
    });

    test("rejeita id inválido ou não inteiro", () => {
      expect(() => parseId("abc")).toThrow("ID inválido");
      expect(() => parseId(1.5)).toThrow("ID inválido");
      expect(() => parseId(0)).toThrow("ID inválido");
      expect(() => parseId(-3)).toThrow("ID inválido");
    });

    test("usa nome de campo customizado quando passado", () => {
      expect(() => parseId("x", "id_produto")).toThrow("id_produto inválido");
    });
  });

  describe("parseNumero", () => {
    test("converte valores numéricos válidos", () => {
      expect(parseNumero("preco", "12.5")).toBe(12.5);
      expect(parseNumero("quantidade", 42)).toBe(42);
    });

    test("rejeita valores não numéricos", () => {
      expect(() => parseNumero("preco", "abc")).toThrow(
        'Campo "preco" precisa ser um número válido',
      );
      expect(() => parseNumero("preco", NaN)).toThrow(
        'Campo "preco" precisa ser um número válido',
      );
    });
  });

  describe("parseData", () => {
    test("aceita string de data válida e retorna string", () => {
      expect(parseData("data_saida", "2026-10-15")).toBe("2026-10-15");
    });

    test("rejeita datas inválidas", () => {
      expect(() => parseData("data_saida", "data-invalida")).toThrow(
        'Campo "data_saida" precisa ser uma data válida',
      );
    });
  });

  describe("parseAtivo", () => {
    test("aceita 0 e 1", () => {
      expect(parseAtivo("0")).toBe(0);
      expect(parseAtivo(1)).toBe(1);
    });

    test("rejeita valores fora de 0 e 1", () => {
      expect(() => parseAtivo(2)).toThrow('Campo "ativo" precisa ser 0 ou 1');
      expect(() => parseAtivo("abc")).toThrow(
        'Campo "ativo" precisa ser 0 ou 1',
      );
    });
  });

  describe("validarCamposObrigatorios", () => {
    test("não lança erro quando todos os campos obrigatórios estão preenchidos", () => {
      expect(() =>
        validarCamposObrigatorios({ nome: "Item", valor: 10 }, ["nome", "valor"]),
      ).not.toThrow();
    });

    test("lança erro listando campos ausentes", () => {
      expect(() =>
        validarCamposObrigatorios({ nome: "" }, ["nome", "preco"]),
      ).toThrow("Campos obrigatórios ausentes: nome, preco");
    });
  });
});
