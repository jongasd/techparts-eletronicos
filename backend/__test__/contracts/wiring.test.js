/**
 * Testes de "fiação": pegam erros que os testes unitários, por mockarem
 * tudo, não enxergam: método de service que o controller chama e não
 * existe, e app que quebra ao ser carregado.
 */
const fs = require("fs");
const path = require("path");

const DIR_CONTROLLERS = path.resolve(__dirname, "../../src/controllers");
const DIR_SERVICES = path.resolve(__dirname, "../../src/services");

describe("fiação controller -> service", () => {
  const arquivos = fs
    .readdirSync(DIR_CONTROLLERS)
    .filter((f) => f.endsWith(".js"));

  it.each(arquivos)(
    "%s só chama métodos que o service realmente exporta",
    (arquivo) => {
      const codigo = fs.readFileSync(path.join(DIR_CONTROLLERS, arquivo), "utf8");
      const importados = [
        ...codigo.matchAll(/const (\w+) = require\("\.\.\/services\/(\w+)"\)/g),
      ];
      const inexistentes = [];

      for (const [, variavel, modulo] of importados) {
        const service = require(path.join(DIR_SERVICES, modulo));
        const chamadas = codigo.matchAll(new RegExp(`\\b${variavel}\\.(\\w+)\\(`, "g"));
        for (const [, metodo] of chamadas) {
          if (typeof service[metodo] !== "function") {
            inexistentes.push(`${variavel}.${metodo}()`);
          }
        }
      }

      expect(inexistentes).toEqual([]);
    },
  );
});

describe("app", () => {
  it("carrega sem lançar erro (ordem de declarações, dependências, rotas)", () => {
    expect(() => require("../../src/app")).not.toThrow();
  });
});