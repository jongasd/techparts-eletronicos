const Ajuste = require("../models/ajuste");
const Produto = require("../models/produtos");
const pool = require("../config/database");
const AppError = require("../utils/appError");
const {
  parseId,
  parseNumero,
  parseData,
  validarCamposObrigatorios,
} = require("../utils/validadores");

const CAMPOS_OBRIGATORIOS_CRIACAO = [
  "id_funcionario",
  "id_produto",
  "quantidade_ajustada",
  "tipo_ajuste",
  "data_ajuste",
];

const TIPOS_AJUSTE_VALIDOS = ["entrada", "saida", "correcao"];

const validarTipoAjuste = (tipo) => {
  if (!TIPOS_AJUSTE_VALIDOS.includes(tipo)) {
    throw new AppError(
      `Tipo de ajuste inválido. Valores aceitos: ${TIPOS_AJUSTE_VALIDOS.join(", ")}`,
      400,
    );
  }
};

const validarCoerenciaTipoQuantidade = (tipo, quantidadeAjustada) => {
  if (quantidadeAjustada === 0) {
    throw new AppError("quantidade_ajustada não pode ser zero", 400);
  }
  if (tipo === "entrada" && quantidadeAjustada < 0) {
    throw new AppError(
      "tipo_ajuste 'entrada' exige quantidade_ajustada positiva",
      400,
    );
  }
  if (tipo === "saida" && quantidadeAjustada > 0) {
    throw new AppError(
      "tipo_ajuste 'saida' exige quantidade_ajustada negativa",
      400,
    );
  }
};

const ajusteService = {
  listarTodos: () => Ajuste.findAll(),

  buscarPorId: async (id) => {
    const idValido = parseId(id);
    const ajuste = await Ajuste.findById(idValido);
    if (!ajuste) {
      throw new AppError("Ajuste não encontrado", 404);
    }
    return ajuste;
  },

  criar: async (body) => {
    validarCamposObrigatorios(body, CAMPOS_OBRIGATORIOS_CRIACAO);
    validarTipoAjuste(body.tipo_ajuste);
    parseData("data_ajuste", body.data_ajuste);

    const idFuncionario = parseNumero("id_funcionario", body.id_funcionario);
    const idProduto = parseNumero("id_produto", body.id_produto);
    const quantidadeAjustada = parseNumero(
      "quantidade_ajustada",
      body.quantidade_ajustada,
    );

    validarCoerenciaTipoQuantidade(body.tipo_ajuste, quantidadeAjustada);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const produto = await Produto.findById(idProduto, conn);
      if (!produto) {
        throw new AppError(`Produto ${idProduto} não encontrado`, 404);
      }

      if (quantidadeAjustada > 0) {
        await Produto.incrementarEstoque(idProduto, quantidadeAjustada, conn);
      } else {
        // quantidadeAjustada é negativo aqui; decrementarEstoque espera
        // uma quantidade positiva pra subtrair, por isso Math.abs.
        const sucesso = await Produto.decrementarEstoque(
          idProduto,
          Math.abs(quantidadeAjustada),
          conn,
        );
        if (!sucesso) {
          throw new AppError(
            `Estoque insuficiente para aplicar o ajuste no produto "${produto.nome_produto}" ` +
              `(disponível: ${produto.quantidade_estoque}, ajuste solicitado: ${quantidadeAjustada})`,
            400,
          );
        }
      }

      const dados = {
        id_funcionario: idFuncionario,
        id_produto: idProduto,
        quantidade_ajustada: quantidadeAjustada,
        tipo_ajuste: String(body.tipo_ajuste),
        data_ajuste: String(body.data_ajuste),
        motivo: body.motivo ? String(body.motivo).trim() : null,
      };

      const novoId = await Ajuste.create(dados, conn);

      await conn.commit();
      return novoId;
    } catch (erro) {
      await conn.rollback();
      throw erro;
    } finally {
      conn.release();
    }
  },

  atualizar: async () => {
    throw new AppError(
      "Ajuste não pode ser editado após criado: lance um novo ajuste para corrigir",
      501,
    );
  },

  excluir: async () => {
    throw new AppError(
      "Ajuste não pode ser excluído: lance um ajuste inverso para reverter",
      501,
    );
  },
};

module.exports = ajusteService;
