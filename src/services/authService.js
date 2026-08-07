const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const Funcionario = require("../models/funcionario");
const AppError = require("../utils/appError");

const SALT_ROUNDS = 10;

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

    const funcionario = await Funcionario.findByLoginComSenha(login);
    if (!funcionario || !funcionario.ativo) {
      throw new AppError("Login ou senha inválidos", 401);
    }

    const senhaConfere = await bcrypt.compare(senha, funcionario.senha_hash);
    if (!senhaConfere) {
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
    if (senha.length < 8) {
      throw new AppError("Senha deve ter ao menos 8 caracteres", 400);
    }

    const existente = await Funcionario.findByLoginComSenha(login);
    if (existente) {
      throw new AppError("Login já está em uso", 409);
    }

    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const id = await Funcionario.create({
      nome_funcionario: String(nome_funcionario).trim(),
      login: String(login).trim(),
      senha_hash,
      id_role: Number(id_role),
      ativo: 1,
    });

    return id;
  },
};

module.exports = authService;
