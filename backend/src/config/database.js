// src/config/database.js
const path = require("path");
const mysql = require("mysql2");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"), // sobe de src/config até a raiz
});

const isLocalhost =
  process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1";

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Habilita SSL para bancos em nuvem (ex: Aiven, RDS, etc.)
if (
  process.env.DB_SSL === "true" ||
  (process.env.NODE_ENV === "production" && !isLocalhost)
) {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool.promise();
