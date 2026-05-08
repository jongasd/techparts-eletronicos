const express = require("express");
const cors = require("cors");
const app = express();

// CORS — permite requisições do frontend
app.use(
  cors({
    origin: "*", // em produção, troque pelo domínio real
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Aumenta o limite para suportar payloads maiores (ex: foto em base64)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rotas
app.use("/categorias", require("./routes/categoriaRoute"));
app.use("/produtos", require("./routes/produtosRoute"));
app.use("/funcionarios", require("./routes/funcionarioRoute"));
app.use("/clientes", require("./routes/clienteRoute"));
app.use("/entradas", require("./routes/entradaRoute"));
app.use("/saidas", require("./routes/saidaRoute"));
app.use("/ajustes", require("./routes/ajusteRoute"));
app.use("/devolucoes", require("./routes/devolucaoRoute"));

app.use(require("./middlewares/errorHandle"));

module.exports = app;
