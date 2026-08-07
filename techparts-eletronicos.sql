-- ============================================================
-- BANCO DE DADOS: Controle de Estoque
-- ============================================================
CREATE DATABASE IF NOT EXISTS db_techparts CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE db_techparts;

-- ============================================================
-- CATEGORIAS
-- ============================================================
CREATE TABLE
    tbl_categorias (
        id_categoria INT NOT NULL AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        PRIMARY KEY (id_categoria)
    );

-- ============================================================
-- PRODUTOS
-- ============================================================
CREATE TABLE
    tbl_produtos (
        id_produto INT NOT NULL AUTO_INCREMENT,
        id_categoria INT NOT NULL,
        nome_produto VARCHAR(150) NOT NULL,
        quantidade_estoque INT NOT NULL DEFAULT 0,
        quantidade_minima INT NOT NULL DEFAULT 0,
        localizacao VARCHAR(100) DEFAULT NULL,
        preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        ativo TINYINT (1) NOT NULL DEFAULT 1, -- soft delete
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id_produto),
        CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES tbl_categorias (id_categoria)
    );

-- ============================================================
-- FUNCIONÁRIOS
-- ============================================================
CREATE TABLE
    tbl_funcionario (
        id_funcionario INT NOT NULL AUTO_INCREMENT,
        nome_funcionario VARCHAR(150) NOT NULL,
        ativo TINYINT (1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id_funcionario)
    );

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE
    tbl_clientes (
        id_cliente INT NOT NULL AUTO_INCREMENT,
        nome_cliente VARCHAR(150) NOT NULL,
        ativo TINYINT (1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id_cliente)
    );

-- ============================================================
-- ENTRADAS
-- ============================================================
CREATE TABLE
    tbl_entrada (
        id_entrada INT NOT NULL AUTO_INCREMENT,
        id_funcionario INT NOT NULL,
        data_entrada DATE NOT NULL,
        observacao TEXT DEFAULT NULL, -- campo extra útil
        PRIMARY KEY (id_entrada),
        CONSTRAINT fk_entrada_funcionario FOREIGN KEY (id_funcionario) REFERENCES tbl_funcionario (id_funcionario)
    );

CREATE TABLE
    tbl_item_entrada (
        id_item_entrada INT NOT NULL AUTO_INCREMENT,
        id_entrada INT NOT NULL,
        id_produto INT NOT NULL,
        quantidade INT NOT NULL,
        valor_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        PRIMARY KEY (id_item_entrada),
        CONSTRAINT fk_item_entrada_entrada FOREIGN KEY (id_entrada) REFERENCES tbl_entrada (id_entrada),
        CONSTRAINT fk_item_entrada_produto FOREIGN KEY (id_produto) REFERENCES tbl_produtos (id_produto)
    );

-- ============================================================
-- SAÍDAS
-- ============================================================
CREATE TABLE
    tbl_saida (
        id_saida INT NOT NULL AUTO_INCREMENT,
        id_cliente INT NOT NULL,
        id_funcionario INT NOT NULL,
        data_saida DATE NOT NULL,
        observacao TEXT DEFAULT NULL,
        PRIMARY KEY (id_saida),
        CONSTRAINT fk_saida_cliente FOREIGN KEY (id_cliente) REFERENCES tbl_clientes (id_cliente),
        CONSTRAINT fk_saida_funcionario FOREIGN KEY (id_funcionario) REFERENCES tbl_funcionario (id_funcionario)
    );

CREATE TABLE
    tbl_item_saida (
        id_item_saida INT NOT NULL AUTO_INCREMENT,
        id_saida INT NOT NULL,
        id_produto INT NOT NULL,
        quantidade INT NOT NULL,
        PRIMARY KEY (id_item_saida),
        CONSTRAINT fk_item_saida_saida FOREIGN KEY (id_saida) REFERENCES tbl_saida (id_saida),
        CONSTRAINT fk_item_saida_produto FOREIGN KEY (id_produto) REFERENCES tbl_produtos (id_produto)
    );

-- ============================================================
-- AJUSTES DE ESTOQUE
-- ============================================================
CREATE TABLE
    tbl_ajuste (
        id_ajuste INT NOT NULL AUTO_INCREMENT,
        id_funcionario INT NOT NULL,
        id_produto INT NOT NULL,
        quantidade_ajustada INT NOT NULL, -- pode ser negativo
        tipo_ajuste ENUM ('entrada', 'saida', 'correcao') NOT NULL DEFAULT 'correcao', -- novo: tipo do ajuste
        data_ajuste DATE NOT NULL,
        motivo VARCHAR(150) DEFAULT NULL,
        PRIMARY KEY (id_ajuste),
        CONSTRAINT fk_ajuste_funcionario FOREIGN KEY (id_funcionario) REFERENCES tbl_funcionario (id_funcionario),
        CONSTRAINT fk_ajuste_produto FOREIGN KEY (id_produto) REFERENCES tbl_produtos (id_produto)
    );

-- ============================================================
-- DEVOLUÇÕES
-- ============================================================
CREATE TABLE
    tbl_devolucao (
        id_devolucao INT NOT NULL AUTO_INCREMENT,
        id_saida INT NOT NULL,
        id_funcionario INT NOT NULL,
        data_devolucao DATE NOT NULL,
        motivo VARCHAR(150) DEFAULT NULL,
        PRIMARY KEY (id_devolucao),
        CONSTRAINT fk_devolucao_saida FOREIGN KEY (id_saida) REFERENCES tbl_saida (id_saida),
        CONSTRAINT fk_devolucao_funcionario FOREIGN KEY (id_funcionario) REFERENCES tbl_funcionario (id_funcionario)
    );

CREATE TABLE
    tbl_item_devolucao (
        id_item_devolucao INT NOT NULL AUTO_INCREMENT,
        id_devolucao INT NOT NULL,
        id_produto INT NOT NULL,
        quantidade_devolvida INT NOT NULL,
        PRIMARY KEY (id_item_devolucao),
        CONSTRAINT fk_item_dev_devolucao FOREIGN KEY (id_devolucao) REFERENCES tbl_devolucao (id_devolucao),
        CONSTRAINT fk_item_dev_produto FOREIGN KEY (id_produto) REFERENCES tbl_produtos (id_produto)
    );

-- ============================================================
-- ÍNDICES (performance em buscas comuns)
-- ============================================================
CREATE INDEX idx_produtos_categoria ON tbl_produtos (id_categoria);

CREATE INDEX idx_produtos_ativo ON tbl_produtos (ativo);

CREATE INDEX idx_entrada_data ON tbl_entrada (data_entrada);

CREATE INDEX idx_saida_data ON tbl_saida (data_saida);

CREATE INDEX idx_saida_cliente ON tbl_saida (id_cliente);

CREATE INDEX idx_ajuste_produto_data ON tbl_ajuste (id_produto, data_ajuste);

CREATE INDEX idx_devolucao_saida ON tbl_devolucao (id_saida);

ALTER TABLE tbl_funcionario
  ADD COLUMN login VARCHAR(60) NOT NULL AFTER nome_funcionario,
  ADD COLUMN senha_hash VARCHAR(255) NOT NULL AFTER login,
  ADD UNIQUE KEY uq_funcionario_login (login);
  CREATE TABLE tbl_roles (
    id_role INT NOT NULL AUTO_INCREMENT,
    nome_role VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_role),
    UNIQUE KEY uq_role_nome (nome_role)
);

CREATE TABLE tbl_permissoes (
    id_permissao INT NOT NULL AUTO_INCREMENT,
    recurso VARCHAR(50) NOT NULL,   -- ex: 'produtos', 'entradas', 'dashboard'
    acao VARCHAR(20) NOT NULL,       -- ex: 'visualizar', 'criar', 'editar', 'excluir'
    PRIMARY KEY (id_permissao),
    UNIQUE KEY uq_permissao (recurso, acao)
);

CREATE TABLE tbl_role_permissao (
    id_role INT NOT NULL,
    id_permissao INT NOT NULL,
    PRIMARY KEY (id_role, id_permissao),
    CONSTRAINT fk_rp_role FOREIGN KEY (id_role) REFERENCES tbl_roles (id_role),
    CONSTRAINT fk_rp_permissao FOREIGN KEY (id_permissao) REFERENCES tbl_permissoes (id_permissao)
);

ALTER TABLE tbl_funcionario
  ADD COLUMN login VARCHAR(60) NOT NULL AFTER nome_funcionario,
  ADD COLUMN senha_hash VARCHAR(255) NOT NULL AFTER login,
  ADD COLUMN id_role INT NOT NULL AFTER senha_hash,
  ADD UNIQUE KEY uq_funcionario_login (login),
  ADD CONSTRAINT fk_funcionario_role FOREIGN KEY (id_role) REFERENCES tbl_roles (id_role);

-- Seed: papel único "admin" com acesso total, pra sistema funcionar
-- enquanto a matriz de papéis real não é definida. Isso é stopgap, não
-- proposta de design final.
INSERT INTO tbl_roles (nome_role) VALUES ('admin');

INSERT INTO tbl_permissoes (recurso, acao)
SELECT recurso, acao FROM (
  SELECT 'categorias' AS recurso, 'visualizar' AS acao UNION ALL
  SELECT 'categorias', 'criar' UNION ALL
  SELECT 'categorias', 'editar' UNION ALL
  SELECT 'categorias', 'excluir' UNION ALL
  SELECT 'produtos', 'visualizar' UNION ALL
  SELECT 'produtos', 'criar' UNION ALL
  SELECT 'produtos', 'editar' UNION ALL
  SELECT 'produtos', 'excluir' UNION ALL
  SELECT 'funcionarios', 'visualizar' UNION ALL
  SELECT 'funcionarios', 'criar' UNION ALL
  SELECT 'funcionarios', 'editar' UNION ALL
  SELECT 'funcionarios', 'excluir' UNION ALL
  SELECT 'clientes', 'visualizar' UNION ALL
  SELECT 'clientes', 'criar' UNION ALL
  SELECT 'clientes', 'editar' UNION ALL
  SELECT 'clientes', 'excluir' UNION ALL
  SELECT 'entradas', 'visualizar' UNION ALL
  SELECT 'entradas', 'criar' UNION ALL
  SELECT 'entradas', 'editar' UNION ALL
  SELECT 'entradas', 'excluir' UNION ALL
  SELECT 'saidas', 'visualizar' UNION ALL
  SELECT 'saidas', 'criar' UNION ALL
  SELECT 'saidas', 'editar' UNION ALL
  SELECT 'saidas', 'excluir' UNION ALL
  SELECT 'ajustes', 'visualizar' UNION ALL
  SELECT 'ajustes', 'criar' UNION ALL
  SELECT 'devolucoes', 'visualizar' UNION ALL
  SELECT 'devolucoes', 'criar' UNION ALL
  SELECT 'dashboard', 'visualizar'
) AS p;

INSERT INTO tbl_role_permissao (id_role, id_permissao)
SELECT (SELECT id_role FROM tbl_roles WHERE nome_role = 'admin'), id_permissao
FROM tbl_permissoes;
INSERT INTO tbl_roles (nome_role) VALUES ('gerente'), ('funcionario');

-- GERENTE: acesso total exceto gestão de funcionários (só visualizar)
INSERT INTO tbl_role_permissao (id_role, id_permissao)
SELECT (SELECT id_role FROM tbl_roles WHERE nome_role = 'gerente'), id_permissao
FROM tbl_permissoes
WHERE NOT (recurso = 'funcionarios' AND acao IN ('criar', 'editar', 'excluir'));

-- FUNCIONÁRIO: operação do dia a dia — sem gestão de funcionários,
-- sem editar/excluir produtos e categorias (só visualizar)
INSERT INTO tbl_role_permissao (id_role, id_permissao)
SELECT (SELECT id_role FROM tbl_roles WHERE nome_role = 'funcionario'), id_permissao
FROM tbl_permissoes
WHERE (recurso = 'categorias' AND acao = 'visualizar')
   OR (recurso = 'produtos' AND acao = 'visualizar')
   OR (recurso = 'clientes' AND acao IN ('visualizar', 'criar', 'editar'))
   OR (recurso IN ('entradas', 'saidas') AND acao IN ('visualizar', 'criar'))
   OR (recurso IN ('ajustes', 'devolucoes') AND acao IN ('visualizar', 'criar'))
   OR (recurso = 'dashboard' AND acao = 'visualizar');

-- Rodar uma vez, manualmente, após criar as roles.
-- Troque a senha antes de rodar — gere o hash com:
-- node -e "require('bcrypt').hash('SUASENHA', 10).then(console.log)"
INSERT INTO tbl_funcionario (nome_funcionario, login, senha_hash, id_role, ativo)
VALUES ('Administrador Inicial', 'admin', '<COLE_O_HASH_AQUI>',
        (SELECT id_role FROM tbl_roles WHERE nome_role = 'admin'), 1);