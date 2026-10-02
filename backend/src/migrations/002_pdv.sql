-- PDV (ponto de venda) — rodar UMA vez em db_techparts, depois de techparts-eletronicos.sql
USE db_techparts;

-- 1) Saída passa a carregar valores monetários e a origem (manual x pdv)
ALTER TABLE tbl_saida
  ADD COLUMN origem   ENUM('manual','pdv') NOT NULL DEFAULT 'manual',
  ADD COLUMN desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN total    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN troco    DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 2) Preço praticado na venda (snapshot: mudar tbl_produtos.preco depois não altera vendas antigas)
--    Saídas manuais antigas ficam com 0.00 — não existe preço histórico para recuperar.
ALTER TABLE tbl_item_saida
  ADD COLUMN preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 3) Código de barras para o leitor do PDV (opcional, único)
ALTER TABLE tbl_produtos
  ADD COLUMN codigo_barras VARCHAR(50) NULL,
  ADD UNIQUE KEY uq_produto_codigo_barras (codigo_barras);

-- 4) Pagamentos (permite pagamento dividido). valor = valor APLICADO à venda:
--    SUM(valor) por saída = total; o troco fica em tbl_saida.troco.
CREATE TABLE tbl_pagamento (
  id_pagamento INT NOT NULL AUTO_INCREMENT,
  id_saida     INT NOT NULL,
  forma        ENUM('dinheiro','pix','debito','credito') NOT NULL,
  valor        DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_pagamento),
  CONSTRAINT fk_pagamento_saida FOREIGN KEY (id_saida) REFERENCES tbl_saida (id_saida),
  CONSTRAINT chk_pagamento_valor CHECK (valor > 0)
);
CREATE INDEX idx_pagamento_saida ON tbl_pagamento (id_saida);

-- 5) Cliente padrão do balcão (tbl_saida.id_cliente é NOT NULL)
INSERT INTO tbl_clientes (nome_cliente, ativo)
SELECT 'Consumidor final', 1
WHERE NOT EXISTS (SELECT 1 FROM tbl_clientes WHERE nome_cliente = 'Consumidor final');

-- 6) Permissões. pdv:desconto é separada de propósito: só admin/gerente.
INSERT INTO tbl_permissoes (recurso, acao) VALUES
  ('pdv','vender'), ('pdv','visualizar'), ('pdv','desconto');

INSERT INTO tbl_role_permissao (id_role, id_permissao)
SELECT r.id_role, p.id_permissao
FROM tbl_roles r
JOIN tbl_permissoes p ON p.recurso = 'pdv'
WHERE r.nome_role IN ('admin','gerente');

INSERT INTO tbl_role_permissao (id_role, id_permissao)
SELECT r.id_role, p.id_permissao
FROM tbl_roles r
JOIN tbl_permissoes p ON p.recurso = 'pdv' AND p.acao IN ('vender','visualizar')
WHERE r.nome_role = 'funcionario';
