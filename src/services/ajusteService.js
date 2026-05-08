const Ajuste = require("../models/ajuste");
const AppError = require("../utils/appError");

const CAMPOS_OBRIGATORIOS_CRIACAO = [
  "id_funcionario",
  "id_produto",
  "quantidade_ajustada",
  "tipo_ajuste",
  "data_ajuste",
];

const TIPOS_AJUSTE_VALIDOS = ["entrada", "saida", "correcao"];

const CAMPOS_ATUALIZAVEIS = [
  "id_funcionario",
  "id_produto",
  "quantidade_ajustada",
  "tipo_ajuste",
  "data_ajuste",
  "motivo",
];

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

const extrairCamposAtualizaveis = (body) => {
  const CAMPOS_NUMERICOS = [
    "id_funcionario",
    "id_produto",
    "quantidade_ajustada",
  ];
  return CAMPOS_ATUALIZAVEIS.reduce((acc, campo) => {
    if (body[campo] !== undefined && body[campo] !== "") {
      acc[campo] = CAMPOS_NUMERICOS.includes(campo)
        ? Number(body[campo])
        : String(body[campo]).trim();
    }
    return acc;
  }, {});
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

    const dados = {
      id_funcionario: Number(body.id_funcionario),
      id_produto: Number(body.id_produto),
      quantidade_ajustada: Number(body.quantidade_ajustada),
      tipo_ajuste: String(body.tipo_ajuste),
      data_ajuste: String(body.data_ajuste),
      motivo: body.motivo ? String(body.motivo).trim() : null,
    };

    return await Ajuste.create(dados);
  },

  atualizar: async (id, body) => {
    const idValido = parseId(id);

    const ajuste = await Ajuste.findById(idValido);
    if (!ajuste) {
      throw new AppError("Ajuste não encontrado", 404);
    }

    if (body.tipo_ajuste) {
      validarTipoAjuste(body.tipo_ajuste);
    }

    const dadosAtualizados = extrairCamposAtualizaveis(body);

    if (Object.keys(dadosAtualizados).length === 0) {
      throw new AppError("Nenhum campo válido informado para atualização", 400);
    }

    await Ajuste.update(idValido, dadosAtualizados);
  },

  excluir: async (id) => {
    const idValido = parseId(id);
    const resultado = await Ajuste.delete(idValido);

    if (resultado.affectedRows === 0) {
      throw new AppError("Ajuste não encontrado", 404);
    }
  },
};

module.exports = ajusteService;
