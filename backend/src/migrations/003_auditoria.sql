-- ============================================================
-- AUDITORIA: Log de ações administrativas e sensíveis (Issue #17)
-- ============================================================
USE db_techparts;

CREATE TABLE IF NOT EXISTS tbl_log_auditoria (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NULL,
    acao VARCHAR(100) NOT NULL,
    recurso VARCHAR(50) NOT NULL,
    id_recurso VARCHAR(50) NULL,
    detalhes JSON NULL,
    ip VARCHAR(45) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_funcionario) REFERENCES tbl_funcionario (id_funcionario) ON DELETE SET NULL
);

CREATE INDEX idx_log_auditoria_recurso ON tbl_log_auditoria (recurso, id_recurso);
CREATE INDEX idx_log_auditoria_criado_em ON tbl_log_auditoria (criado_em);
