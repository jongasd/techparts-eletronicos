# techparts-eletrônicos

API REST para gerenciamento de estoque e vendas de uma loja de eletrônicos: produtos, categorias, funcionários, clientes, entradas, saídas, ajustes, devoluções, controle de lote e validade, **PDV (ponto de venda)** e dashboard de KPIs. Todas as rotas, exceto `/auth/login`, exigem autenticação e permissão por papel.

## Funcionalidades

- Autenticação com JWT e controle de acesso por papéis e permissões (`admin`, `gerente`, `funcionario`)
- CRUD de produtos (soft delete), categorias, funcionários e clientes
- Movimentações de estoque: entradas, saídas, ajustes e devoluções
- Controle de lote e validade: cada item de entrada gera um lote, e as saídas consomem lotes por validade mais próxima (FEFO)
- PDV: venda de balcão com preço definido pelo servidor, pagamento dividido, troco, desconto com permissão própria e baixa de estoque transacional
- Dashboard: valor em estoque, produtos abaixo do mínimo, movimentações recentes e distribuição por categoria

## Stack

- Node.js + Express 5
- MySQL via `mysql2` (queries manuais com pool, sem ORM)
- JWT (`jsonwebtoken`) + `bcrypt`
- Jest para testes
- CORS + dotenv

## Estrutura

```
src/
├── app.js                   # configuração do Express e montagem das rotas
├── server.js                # ponto de entrada, sobe o servidor HTTP
├── migrarLotesExistentes.js # script único: cria lote inicial para estoque legado
├── config/
│   └── database.js          # pool de conexão MySQL
├── routes/                  # definição das rotas por recurso
├── controllers/             # camada HTTP (request/response)
├── services/                # regras de negócio e transações
├── models/                  # acesso a dados
├── middlewares/
│   ├── auth.js              # valida o JWT e preenche req.funcionario
│   ├── autorizar.js         # checa permissão "recurso:acao"
│   └── errorHandle.js       # tratamento centralizado de erros
└── utils/
    └── appError.js          # classe de erro customizada
migrations/
└── 002_pdv.sql              # tabelas, colunas e permissões do PDV
__test__/services/           # testes unitários dos services
```

## Configuração

Crie um arquivo `.env` na raiz do backend (ele não deve ser versionado):

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DB_HOST` | sim | host do MySQL |
| `DB_PORT` | sim | porta do MySQL |
| `DB_USER` | sim | usuário do banco |
| `DB_PASSWORD` | sim | senha do banco |
| `DB_NAME` | sim | nome do banco (`db_techparts`) |
| `JWT_SECRET` | sim | segredo usado para assinar os tokens; use um valor longo e aleatório |
| `JWT_EXPIRES_IN` | não | validade do token (padrão `8h`) |
| `PORT` | não | porta da API (padrão `3000`) |

## Instalação e execução

```bash
# 1. instalar dependências
npm install

# 2. criar o banco e o schema base (tabelas, papéis, permissões e usuário admin)
mysql -u seu_usuario -p < techparts-eletronicos.sql

# 3. aplicar a migração do PDV (uma única vez)
mysql -u seu_usuario -p < migrations/002_pdv.sql

# 4. subir o servidor
node src/server.js
```

Problemas conhecidos neste setup (schema base e usuário `admin`): veja [README-PENDENCIAS.md](./README-PENDENCIAS.md).

Se o banco já tinha produtos com estoque antes do controle de lote, rode uma única vez `node src/migrarLotesExistentes.js`. O script é idempotente e cria uma entrada `MIGRACAO_LOTES_INICIAL` com um lote por produto. Sem ele, saídas desses produtos falham com erro de inconsistência entre estoque e lotes.

## Autenticação e permissões

```
POST /auth/login       # { "login": "...", "senha": "..." } -> { token, funcionario }
POST /auth/registrar   # cria funcionário; exige funcionarios:criar (por padrão, admin)
```

Envie o token em todas as demais requisições:

```
Authorization: Bearer <token>
```

As permissões têm o formato `recurso:acao` (ex.: `produtos:criar`) e vão dentro do token, então **alterações de permissão só valem após um novo login**.

| Papel | Acesso |
|---|---|
| `admin` | todas as permissões |
| `gerente` | tudo, exceto criar, editar e excluir funcionários |
| `funcionario` | visualiza categorias e produtos; clientes (ver, criar, editar); entradas, saídas, ajustes e devoluções (ver e criar); dashboard; PDV (`vender`, `visualizar`) |

## Endpoints

### Recursos com CRUD

```
GET    /<recurso>       # lista todos        (<recurso>:visualizar)
GET    /<recurso>/:id   # busca por id       (<recurso>:visualizar)
POST   /<recurso>       # cria               (<recurso>:criar)
PUT    /<recurso>/:id   # atualiza           (<recurso>:editar)
DELETE /<recurso>/:id   # exclui             (<recurso>:excluir)
```

| Recurso | Base | Observações |
|---|---|---|
| Categorias | `/categorias` | |
| Produtos | `/produtos` | `PUT /:id/desativar` e `PUT /:id/ativar` (soft delete); a listagem traz só produtos ativos |
| Funcionários | `/funcionarios` | |
| Clientes | `/clientes` | |
| Entradas | `/entradas` | cada item aceita `numero_lote` e `data_validade` (opcionais) e gera um lote; editar itens e excluir estão desabilitados (501) |
| Saídas | `/saidas` | itens: `id_produto` e `quantidade`; baixa de estoque e de lote em transação; editar itens e excluir estão desabilitados (501) |
| Ajustes | `/ajustes` | só `GET` e `POST` funcionam; `PUT` e `DELETE` retornam 501. `tipo_ajuste` (`entrada`, `saida`, `correcao`) deve ser coerente com o sinal de `quantidade_ajustada` |
| Devoluções | `/devolucoes` | só `GET` e `POST` |

### Lotes

| Método | Rota | Descrição |
|---|---|---|
| GET | `/lotes/produto/:id_produto` | lotes de um produto |
| GET | `/lotes/vencendo?dias=30` | lotes com saldo que vencem em até N dias (padrão 30) |

### PDV

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/pdv/produtos?busca=` | `pdv:vender` | busca por código de barras exato ou parte do nome (mín. 2 caracteres); só produtos ativos com saldo |
| POST | `/pdv/vendas` | `pdv:vender` | registra a venda |
| GET | `/pdv/vendas/:id` | `pdv:visualizar` | recibo: itens, preços praticados e pagamentos |

Exemplo de venda:

```json
POST /pdv/vendas
{
  "id_cliente": 5,
  "desconto": 2.00,
  "observacao": "retira no balcão",
  "itens": [
    { "id_produto": 10, "quantidade": 3 }
  ],
  "pagamentos": [
    { "forma": "dinheiro", "valor": 50.00 }
  ]
}
```

Resposta (`201`):

```json
{
  "sucesso": true,
  "mensagem": "Venda registrada",
  "dados": {
    "id_saida": 55,
    "subtotal": "30.30",
    "desconto": "2.00",
    "total": "28.30",
    "recebido": "50.00",
    "troco": "21.70"
  }
}
```

Regras:

- O **preço vem de `tbl_produtos`** no momento da venda e fica gravado em `tbl_item_saida.preco_unitario`; preço enviado pelo cliente é ignorado. O **vendedor vem do token**, não do body.
- `id_cliente` é opcional; sem ele a venda vai para o cliente "Consumidor final", criado pela migração.
- `forma` aceita `dinheiro`, `pix`, `debito` e `credito`; é possível dividir o pagamento em várias formas.
- O pagamento precisa cobrir o total. Só dinheiro gera troco, e pix ou cartão acima do total são rejeitados.
- `desconto` exige a permissão `pdv:desconto` (admin e gerente) e precisa ser menor que o subtotal.
- Linhas repetidas do mesmo produto são somadas. Valores monetários aceitam no máximo 2 casas decimais.
- A venda inteira é uma transação: se qualquer item falhar (estoque insuficiente, produto inativo ou sem preço), nada é gravado.

### Dashboard

Exige `dashboard:visualizar`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/resumo` | total de produtos ativos, valor total em estoque, produtos abaixo do mínimo, entradas/saídas de hoje |
| GET | `/dashboard/produtos-categoria` | contagem de produtos ativos por categoria |
| GET | `/dashboard/movimentacoes` | entradas e saídas dos últimos 7 dias |
| GET | `/dashboard/estoque-baixo` | produtos ativos com estoque abaixo da quantidade mínima |

## Modelo de dados

Schema em `techparts-eletronicos.sql`, com as extensões do PDV em `migrations/002_pdv.sql`:

| Tabela | Descrição |
|---|---|
| `tbl_categorias` | categorias de produtos |
| `tbl_produtos` | catálogo, com `quantidade_estoque`, `quantidade_minima`, `preco` e `codigo_barras` |
| `tbl_funcionario` | funcionários, com `login`, `senha_hash` e `id_role` |
| `tbl_roles` / `tbl_permissoes` / `tbl_role_permissao` | papéis, permissões `recurso:acao` e a relação entre eles |
| `tbl_clientes` | clientes |
| `tbl_entrada` / `tbl_item_entrada` | entradas de estoque e seus itens |
| `tbl_lote` | lotes gerados pelas entradas, com `quantidade_atual` e `data_validade` |
| `tbl_saida` / `tbl_item_saida` | saídas e itens; a saída tem `origem` (`manual` ou `pdv`), `desconto`, `total` e `troco`, e o item tem `preco_unitario` |
| `tbl_saida_lote` | quanto de cada lote cada item de saída consumiu |
| `tbl_pagamento` | pagamentos de uma venda (valor já descontado do troco) |
| `tbl_ajuste` | ajustes manuais de estoque |
| `tbl_devolucao` / `tbl_item_devolucao` | devoluções e seus itens |

## Testes

```bash
npm test
```

Os testes são unitários e mockam os models e o pool, ou seja, não precisam de banco. Como eles não exercitam o SQL, mudanças em models devem ser conferidas contra um MySQL real.

## Licença

MIT — ver [LICENSE](./LICENSE).