const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const Funcionario = require("../models/funcionario");
const AppError = require("../utils/appError");

const SALT_ROUNDS = 10;

// Hash bcrypt válido de uma senha aleatória que nunca é usada de verdade.
// Serve só pra bcrypt.compare ter algo pra comparar quando o login não
// existe, gastando um tempo parecido com o de uma comparação real — sem
// isso, um login inexistente retorna mais rápido que um login existente
// com senha errada, e essa diferença de tempo é o suficiente pra alguém
// enumerar quais logins existem no sistema.
const HASH_PLACEHOLDER =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q8HuJqjSGBjXHy1xw12pR8ZKh9L3W";

const parseNumero = (campo, valor) => {
  const numero = Number(valor);
  if (Number.isNaN(numero) || !Number.isFinite(numero)) {
    throw new AppError(`Campo "${campo}" precisa ser um número válido`, 400);
  }
  return numero;
};

const buscarPermissoes = async (idRole) => {
  const [rows] = await pool.query(
    `SELECT p.recurso, p.acao
     FROM tbl_role_permissao rp
     INNER JOIN tbl_permissoes p ON p.id_permissao = rp.id_permissao
     WHERE rp.id_role = ?`,
    [idRole],
  );
  return rows.map((r) => `${r.recurso}:${r.acao}`);
};

const authService = {
  login: async (login, senha) => {
    if (!login || !senha) {
      throw new AppError("Login e senha são obrigatórios", 400);
    }

    const loginNormalizado = String(login).trim();
    const funcionario = await Funcionario.findByLoginComSenha(loginNormalizado);

    // bcrypt.compare roda sempre, exista ou não o funcionário, contra o
    // hash real ou o placeholder — ver comentário de HASH_PLACEHOLDER.
    const senhaConfere = await bcrypt.compare(
      senha,
      funcionario?.senha_hash ?? HASH_PLACEHOLDER,
    );

    if (!funcionario || !funcionario.ativo || !senhaConfere) {
      throw new AppError("Login ou senha inválidos", 401);
    }

    const permissoes = await buscarPermissoes(funcionario.id_role);

    const payload = {
      id_funcionario: funcionario.id_funcionario,
      login: funcionario.login,
      id_role: funcionario.id_role,
      permissoes, // ["produtos:criar", "produtos:visualizar", ...]
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    });

    return {
      token,
      funcionario: {
        id_funcionario: funcionario.id_funcionario,
        nome_funcionario: funcionario.nome_funcionario,
        login: funcionario.login,
      },
    };
  },

  registrar: async ({ nome_funcionario, login, senha, id_role }) => {
    if (!nome_funcionario || !login || !senha || !id_role) {
      throw new AppError(
        "nome_funcionario, login, senha e id_role são obrigatórios",
        400,
      );
    }

    const nomeNormalizado = String(nome_funcionario).trim();
    const loginNormalizado = String(login).trim();

    if (!nomeNormalizado || !loginNormalizado) {
      throw new AppError(
        "nome_funcionario e login não podem ser vazios ou só espaços",
        400,
      );
    }

    if (senha.length < 8) {
      throw new AppError("Senha deve ter ao menos 8 caracteres", 400);
    }

    const idRoleValido = parseNumero("id_role", id_role);

    const existente = await Funcionario.findByLoginComSenha(loginNormalizado);
    if (existente) {
      throw new AppError("Login já está em uso", 409);
    }

    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    try {
      const id = await Funcionario.create({
        nome_funcionario: nomeNormalizado,
        login: loginNormalizado,
        senha_hash,
        id_role: idRoleValido,
        ativo: 1,
      });
      return id;
    } catch (erro) {
      // Corrida entre o SELECT de existente e o INSERT: se duas
      // requisições com o mesmo login passarem pelo check acima quase
      // juntas, só colidem aqui, na constraint UNIQUE do banco.
      // "ER_DUP_ENTRY" é o código do mysql2 — ajuste se o driver for outro.
      if (erro.code === "ER_DUP_ENTRY") {
        throw new AppError("Login já está em uso", 409);
      }
      throw erro;
    }
  },
};

module.exports = authService;
