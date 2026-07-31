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