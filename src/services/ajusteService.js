const Ajuste = require("../models/ajuste");
const Produto = require("../models/produtos");
const pool = require("../config/database");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = [
  "id_funcionario",
  "id_produto",
  "quantidade_ajustada",
  "tipo_ajuste",
  "data_ajuste",
];

const TIPOS_AJUSTE_VALIDOS = ["entrada", "saida", "correcao"];

const parseId = (id) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("ID inválido", 400);
  }
  return parsed;
};

const validarCamposObrigatorios = (dados) => {
  const faltando = CAMPOS_OBRIGATORIOS_CRIACAO.filter(
    (campo) =>
      dados[campo] === undefined ||
      dados[campo] === null ||
      dados[campo] === "",
  );
  if (faltando.length > 0) {
    throw new AppError(
      `Campos obrigatórios ausentes: ${faltando.join(", ")}`,
      400,
    );
  }
};

const validarTipoAjuste = (tipo) => {
  if (!TIPOS_AJUSTE_VALIDOS.includes(tipo)) {
    throw new AppError(
      `Tipo de ajuste inválido. Valores aceitos: ${TIPOS_AJUSTE_VALIDOS.join(", ")}`,
      400,
    );
  }
};

// O sinal de quantidade_ajustada é a fonte da verdade do delta de estoque.
// tipo_ajuste só precisa ser coerente com esse sinal — evita o caso
// tipo_ajuste="saida" + quantidade_ajustada positivo, que seria ambíguo.
// "correcao" aceita qualquer sinal (exceto zero) porque cobre tanto
// correção pra cima quanto pra baixo.
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
    validarCamposObrigatorios(body);
    validarTipoAjuste(body.tipo_ajuste);

    const idProduto = Number(body.id_produto);
    const quantidadeAjustada = Number(body.quantidade_ajustada);

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
        id_funcionario: Number(body.id_funcionario),
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

  // Bloqueado de propósito: editar/excluir um ajuste já aplicado deixaria
  // o histórico de auditoria de estoque divergente do saldo real em
  // tbl_produtos, sem trilha de reversão. Um ajuste errado se corrige
  // com outro ajuste (lançamento novo), não editando o antigo.
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
