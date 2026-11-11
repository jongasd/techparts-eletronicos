const multer = require("multer");
const AppError = require("../utils/appError");
const { MAX_BYTES, MAX_MB } = require("../config/upload");

const MIMES_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

// memoryStorage: o arquivo só vai para o disco depois que o service valida o
// conteúdo (magic bytes) e os demais campos. Sem arquivo temporário órfão.
const receberUmaImagem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 20, parts: 25 },
  fileFilter: (req, file, cb) => {
    if (!MIMES_ACEITOS.includes(file.mimetype)) {
      return cb(
        new AppError("Formato não suportado: use JPG, PNG ou WebP", 415),
      );
    }
    cb(null, true);
  },
}).single("imagem");

// Só age em multipart/form-data. Requisições JSON passam direto, então o
// frontend que já envia JSON continua funcionando sem alteração.
const uploadImagem = (req, res, next) => {
  receberUmaImagem(req, res, (erro) => {
    if (!erro) return next();

    if (erro instanceof multer.MulterError) {
      if (erro.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(`Imagem maior que ${MAX_MB} MB`, 413));
      }
      if (erro.code === "LIMIT_UNEXPECTED_FILE") {
        return next(new AppError('Envie o arquivo no campo "imagem"', 400));
      }
      return next(new AppError(`Upload inválido: ${erro.message}`, 400));
    }
    return next(erro);
  });
};

module.exports = uploadImagem;
