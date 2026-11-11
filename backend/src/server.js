require("./config/env"); // primeiro: carrega o .env e aborta se a configuração for inválida

const app = require("./app");

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "production" && !process.env.UPLOAD_DIR) {
  console.warn(
    "[Upload] UPLOAD_DIR não definido: as imagens vão para o disco do container " +
      "e SÃO PERDIDAS a cada deploy. Monte um volume persistente e aponte UPLOAD_DIR para ele.",
  );
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
