  const app = require("./app"); // Importa as configurações do app.js
require("dotenv").config()

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
