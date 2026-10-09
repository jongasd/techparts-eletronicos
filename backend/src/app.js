const express = require("express");
const rateLimit = require("express-rate-limit");

if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      sucesso: false,
      mensagem:
        "Muitas tentativas de login. Tente novamente em alguns minutos.",
    }),
});
const cors = require("cors");
const app = express();

app.use("/auth/login", limitadorLogin);

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");

// Origens separadas por vírgula, sem barra no final. Ex.: https://meusite.com.br
const origensPermitidas = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Sem header Origin (curl, Postman, servidor-servidor): CORS não se aplica
      if (!origin || origensPermitidas.includes(origin)) {
        return callback(null, true);
      }
      // false = sem headers CORS, o navegador bloqueia. Não use new Error() aqui:
      // viraria 500 no seu errorHandler.
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);  
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/auth", require("./routes/authRoute"));

app.use("/categorias", require("./routes/categoriaRoute"));
app.use("/produtos", require("./routes/produtosRoute"));
app.use("/funcionarios", require("./routes/funcionarioRoute"));
app.use("/clientes", require("./routes/clienteRoute"));
app.use("/entradas", require("./routes/entradaRoute"));
app.use("/saidas", require("./routes/saidaRoute"));
app.use("/ajustes", require("./routes/ajusteRoute"));
app.use("/devolucoes", require("./routes/devolucaoRoute"));
app.use("/dashboard", require("./routes/dashboardRoute"));
app.use("/pdv", require("./routes/pdvRoute"));
app.use("/lotes", require("./routes/lotes"));
app.use(require("./middlewares/errorHandle"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

module.exports = app;
