-- ============================================================
-- 004 — Imagem do produto
-- Seguro para rodar em banco JÁ em produção:
--   * não usa USE nem CREATE DATABASE (rode conectado ao banco certo,
--     seja db_techparts, defaultdb do Aiven, etc.);
--   * idempotente: rodar duas vezes não dá erro;
--   * só adiciona uma coluna NULL: não reescreve dados nem trava a tabela.
-- A coluna guarda APENAS o nome do arquivo (ex.: 3f2c...e1.jpg), nunca o caminho.
-- ============================================================

SET @existe := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'tbl_produtos'
    AND COLUMN_NAME  = 'imagem'
);

SET @ddl := IF(
  @existe = 0,
  'ALTER TABLE tbl_produtos ADD COLUMN imagem VARCHAR(255) NULL',
  'SELECT ''coluna imagem ja existe - nada a fazer'' AS aviso'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
