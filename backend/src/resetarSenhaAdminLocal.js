const bcrypt = require("bcrypt");
const { randomBytes } = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const readline = require("readline");
const pool = require("./config/database");
const authService = require("./services/authService");

const lerSenhaOculta = (prompt) => {
  const entrada = process.stdin;
  if (!entrada.isTTY || typeof entrada.setRawMode !== "function") {
    throw new Error("Execute este comando em um terminal interativo.");
  }

  readline.emitKeypressEvents(entrada);
  entrada.setRawMode(true);
  entrada.resume();
  process.stdout.write(prompt);

  return new Promise((resolve, reject) => {
    let senha = "";

    const finalizar = () => {
      entrada.setRawMode(false);
      entrada.removeListener("keypress", aoPressionar);
      process.stdout.write("\n");
    };

    const aoPressionar = (caractere, tecla) => {
      if (tecla.ctrl && tecla.name === "c") {
        finalizar();
        reject(new Error("Operação cancelada."));
      } else if (tecla.name === "return") {
        finalizar();
        resolve(senha);
      } else if (tecla.name === "backspace") {
        senha = senha.slice(0, -1);
      } else if (!tecla.ctrl && !tecla.meta) {
        senha += caractere;
      }
    };

    entrada.on("keypress", aoPressionar);
  });
};

async function redefinirSenhaAdminLocal() {
  const hostBanco = String(process.env.DB_HOST || "").toLowerCase();
  if (!new Set(["localhost", "127.0.0.1", "::1"]).has(hostBanco)) {
    throw new Error("Por segurança, este comando só funciona com MySQL local.");
  }

  const [funcionarios] = await pool.query(
    `SELECT f.id_funcionario
     FROM tbl_funcionario f
     INNER JOIN tbl_roles r ON r.id_role = f.id_role
     WHERE f.login = ? AND f.ativo = 1 AND r.nome_role = 'admin'
     LIMIT 1`,
    ["admin"],
  );

  if (!funcionarios[0]) {
    throw new Error("Não existe um funcionário admin ativo neste banco local.");
  }

  const gerarSenha = process.argv.includes("--generate");
  const senha = gerarSenha
    ? randomBytes(24).toString("base64url")
    : await lerSenhaOculta("Nova senha (mínimo 8 caracteres): ");

  if (senha.length < 8) {
    throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  }

  const arquivoSenha = gerarSenha
    ? path.resolve(__dirname, "../.local-admin-credentials.txt")
    : null;

  if (gerarSenha) {
    await fs.writeFile(
      arquivoSenha,
      `Login: admin\nSenha temporária: ${senha}\n`,
      { encoding: "utf8", mode: 0o600, flag: "wx" },
    );
  } else {
    const confirmacao = await lerSenhaOculta("Confirme a nova senha: ");
    if (senha !== confirmacao) {
      throw new Error("As senhas não conferem.");
    }
  }

  const hash = await bcrypt.hash(senha, 12);
  try {
    await pool.query(
      "UPDATE tbl_funcionario SET senha_hash = ? WHERE id_funcionario = ?",
      [hash, funcionarios[0].id_funcionario],
    );
  } catch (erro) {
    if (arquivoSenha) await fs.unlink(arquivoSenha).catch(() => {});
    throw erro;
  }

  const resultadoLogin = await authService.login("admin", senha);
  console.log("Login local verificado:", Boolean(resultadoLogin.token));
  if (arquivoSenha) {
    console.log("Credencial temporária salva em backend/.local-admin-credentials.txt");
  } else {
    console.log("Senha local do login admin redefinida.");
  }
}

redefinirSenhaAdminLocal()
  .catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());