const express = require("express");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: "*",
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
app.use('/lotes', require('./routes/lotes'));
app.use(require("./middlewares/errorHandle"));

module.exports = app;
