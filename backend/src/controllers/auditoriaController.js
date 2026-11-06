const Auditoria = require("../models/auditoria");

const auditoriaController = {
  listarTodas: async (req, res, next) => {
    try {
      const { pagina, limite, acao, recurso } = req.query;
      const resultado = await Auditoria.findAll({
        pagina,
        limite,
        acao,
        recurso,
      });

      if (resultado && typeof resultado === "object" && !Array.isArray(resultado)) {
        res.json({
          sucesso: true,
          dados: resultado.registros,
          total: resultado.total,
          pagina: resultado.pagina,
          limite: resultado.limite,
          totalPaginas: resultado.totalPaginas,
        });
      } else {
        res.json({ sucesso: true, dados: resultado, total: resultado.length });
      }
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = auditoriaController;
