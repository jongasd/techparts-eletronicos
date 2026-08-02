# techparts-eletrônicos

API REST para gerenciamento de estoque de uma loja de eletrônicos: controle de produtos, categorias, funcionários, clientes, entradas, saídas, ajustes e devoluções, com endpoints de dashboard para acompanhamento de KPIs.

## Funcionalidades

- CRUD completo de produtos, categorias, funcionários e clientes
- Registro de movimentações de estoque: entradas, saídas, ajustes e devoluções
- Dashboard com indicadores: valor total em estoque, produtos abaixo do mínimo, movimentações recentes e distribuição por categoria

## Stack

- Node.js + Express 5
- MySQL (via `mysql2`)
- CORS + dotenv

## Estrutura

```
src/
├── app.js              # configuração do Express e montagem das rotas
├── server.js            # ponto de entrada, sobe o servidor HTTP
├── config/
│   └── database.js      # pool de conexão MySQL
├── routes/               # definição das rotas por recurso
├── controllers/          # camada HTTP (request/response)
├── services/              # regras de negócio
├── models/                # acesso a dados
├── middlewares/
│   └── errorHandle.js    # tratamento centralizado de erros
└── utils/
    └── appError.js        # classe de erro customizada
```

## Modelo de dados

Schema definido em `techparts-eletronicos.sql`:

| Tabela | Descrição |
|---|---|
| `tbl_categorias` | categorias de produtos |
| `tbl_produtos` | catálogo de produtos, com `quantidade_estoque` e `quantidade_minima` |
| `tbl_funcionario` | funcionários |
| `tbl_clientes` | clientes |
| `tbl_entrada` / `tbl_item_entrada` | entradas de estoque e seus itens |
| `tbl_saida` / `tbl_item_saida` | saídas de estoque e seus itens |
| `tbl_ajuste` | ajustes manuais de estoque |
| `tbl_devolucao` / `tbl_item_devolucao` | devoluções e seus itens |

## Endpoints

Todos os recursos abaixo seguem o mesmo padrão CRUD:

```
GET    /<recurso>       # lista todos
GET    /<recurso>/:id   # busca por id
POST   /<recurso>       # cria
PUT    /<recurso>/:id   # atualiza
DELETE /<recurso>/:id   # exclui
```

| Recurso | Base |
|---|---|
| Categorias | `/categorias` |
| Produtos | `/produtos` |
| Funcionários | `/funcionarios` |
| Clientes | `/clientes` |
| Entradas | `/entradas` |
| Saídas | `/saidas` |
| Ajustes | `/ajustes` |
| Devoluções | `/devolucoes` |

### Dashboard

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/resumo` | total de produtos ativos, valor total em estoque, produtos abaixo do mínimo, entradas/saídas de hoje |
| GET | `/dashboard/produtos-categoria` | contagem de produtos ativos por categoria |
| GET | `/dashboard/movimentacoes` | entradas e saídas dos últimos 7 dias |
| GET | `/dashboard/estoque-baixo` | produtos ativos com estoque abaixo da quantidade mínima |

## Instalação e execução

```bash
# instalar dependências
npm install

# criar o banco e popular o schema
mysql -u seu_usuario -p < techparts-eletronicos.sql

# subir o servidor
node src/server.js
```

## Licença

MIT — ver [LICENSE](./LICENSE).
