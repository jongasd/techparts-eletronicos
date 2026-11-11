const produtoService = require("../services/produtoService");
const { urlImagem } = require("../utils/imagem");

// A coluna guarda só o nome do arquivo; a URL pública é montada aqui.
const comUrlImagem = (produto) =>
  produto ? { ...produto, imagem_url: urlImagem(produto.imagem) } : produto;

const produtoController = {
  listarTodas: async (req, res, next) => {
    try {
      const { pagina, limite, busca, id_categoria } = req.query;
      const resultado = await produtoService.listarTodas({
        pagina,
        limite,
        busca,
        id_categoria,
      });

      if (resultado && typeof resultado === "object" && !Array.isArray(resultado)) {
        res.json({
          sucesso: true,
          dados: resultado.registros.map(comUrlImagem),
          total: resultado.total,
          pagina: resultado.pagina,
          limite: resultado.limite,
          totalPaginas: resultado.totalPaginas,
        });
      } else {
        res.json({
          sucesso: true,
          dados: resultado.map(comUrlImagem),
          total: resultado.length,
        });
      }
    } catch (erro) {
      next(erro);
    }
  },

  buscarPorId: async (req, res, next) => {
    try {
      const produto = await produtoService.buscarPorId(req.params.id);
      res.json({ sucesso: true, dados: comUrlImagem(produto) });
    } catch (erro) {
      next(erro);
    }
  },

  criar: async (req, res, next) => {
    try {
      const novoId = await produtoService.criar(req.body ?? {}, req.file);
      res.status(201).json({
        sucesso: true,
        mensagem: "Produto criado com sucesso",
        id: novoId,
      });
    } catch (erro) {
      next(erro);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      await produtoService.atualizar(
        req.params.id,
        req.body ?? {},
        req.file,
      );
      res.json({ sucesso: true, mensagem: "Produto atualizado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  removerImagem: async (req, res, next) => {
    try {
      await produtoService.removerImagem(req.params.id);
      res.json({ sucesso: true, mensagem: "Imagem removida com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  desativar: async (req, res, next) => {
    try {
      await produtoService.desativar(req.params.id);
      res.json({ sucesso: true, mensagem: "Produto desativado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },

  // Faltava por completo: service e model já tinham ativar(), mas não
  // existia handler pra expor isso na API.
  ativar: async (req, res, next) => {
    try {
      await produtoService.ativar(req.params.id);
      res.json({ sucesso: true, mensagem: "Produto ativado com sucesso" });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = produtoController;
