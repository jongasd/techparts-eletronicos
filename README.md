<div align="center">

# 🔌 TechParts Eletrônicos

**Sistema web para gerenciamento de estoque e vendas de uma loja de eletrônicos**

![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-mysql2-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## 📖 Sobre o projeto

O **TechParts Eletrônicos** é um sistema completo para o controle de estoque e vendas de uma loja de eletrônicos. Ele reúne em um só lugar o cadastro de produtos, categorias, clientes e funcionários, o registro de entradas, saídas, ajustes e devoluções de estoque, o controle de lote e validade, um **PDV (ponto de venda)** para vendas de balcão e um **dashboard** com os principais indicadores da loja.

O projeto é dividido em duas partes:

- **Back-end:** API REST em Node.js + Express com banco de dados MySQL, autenticação JWT e controle de acesso por papéis.
- **Front-end:** interface web em React + Vite, que consome a API.

## ✨ Funcionalidades

- 🔐 **Autenticação com JWT** e controle de acesso por papéis e permissões (`admin`, `gerente`, `funcionario`)
- 📦 **Cadastros:** produtos (com exclusão lógica), categorias, funcionários e clientes
- 🔄 **Movimentações de estoque:** entradas, saídas, ajustes e devoluções
- 🏷️ **Controle de lote e validade:** cada item de entrada gera um lote, e as saídas consomem os lotes pela validade mais próxima (**FEFO**)
- 🛒 **PDV (ponto de venda):**
  - preço definido pelo servidor, sem confiar no valor enviado pelo cliente
  - pagamento dividido entre dinheiro, Pix, débito e crédito
  - cálculo de troco
  - desconto restrito por permissão
  - baixa de estoque em transação: se qualquer item falhar, nada é gravado
- 📊 **Dashboard de KPIs:** valor em estoque, produtos abaixo do mínimo, movimentações recentes e distribuição por categoria
- 📚 **Documentação da API com Swagger**
- 🛡️ **Limite de requisições (rate limit)** para proteger a API

## 🛠️ Tecnologias

| Camada | Tecnologias |
| ------ | ----------- |
| Front-end | React 19, Vite, React Router, Bootstrap 5, Recharts |
| Back-end | Node.js, Express 5, JWT (`jsonwebtoken`), `bcrypt`, `express-rate-limit`, CORS, dotenv |
| Banco de dados | MySQL, via `mysql2` (queries manuais com pool, sem ORM) |
| Documentação | Swagger (`swagger-ui-express` + `swagger-autogen`) |
| Testes | Jest |
| Ferramentas | Git, GitHub, ESLint |

## 📁 Estrutura do projeto

```
techparts-eletronicos/
├── backend/
│   ├── src/
│   │   ├── app.js            # configuração do Express e rotas
│   │   ├── server.js         # ponto de entrada
│   │   ├── config/           # conexão com o MySQL
│   │   ├── routes/           # rotas por recurso
│   │   ├── controllers/      # camada HTTP
│   │   ├── services/         # regras de negócio e transações
│   │   ├── models/           # acesso a dados
│   │   ├── middlewares/      # autenticação, autorização e erros
│   │   └── utils/
│   ├── migrations/           # migração do PDV
│   └── __test__/             # testes unitários
└── frontend/                 # aplicação React (Vite)
```

A API segue uma arquitetura em camadas: **routes → controllers → services → models**.

## 🚀 Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS)
- [MySQL](https://www.mysql.com/)
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/jongasd/techparts-eletronicos.git
cd techparts-eletronicos
```

### 2. Back-end

```bash
cd backend

# instalar dependências
npm install
```

Crie um arquivo `.env` na raiz do `backend` (ele não deve ser versionado):

| Variável | Obrigatória | Descrição |
| -------- | ----------- | --------- |
| `DB_HOST` | sim | host do MySQL |
| `DB_PORT` | sim | porta do MySQL |
| `DB_USER` | sim | usuário do banco |
| `DB_PASSWORD` | sim | senha do banco |
| `DB_NAME` | sim | nome do banco (`db_techparts`) |
| `JWT_SECRET` | sim | segredo para assinar os tokens (use um valor longo e aleatório) |
| `JWT_EXPIRES_IN` | não | validade do token (padrão `8h`) |
| `PORT` | não | porta da API (padrão `3000`) |

Crie o banco e suba o servidor:

```bash
# cria o banco, tabelas, papéis, permissões e o usuário admin
mysql -u seu_usuario -p < techparts-eletronicos.sql

# aplica a migração do PDV (uma única vez)
mysql -u seu_usuario -p < migrations/002_pdv.sql

# inicia a API
npm start          # ou: npm run dev (com reload automático)
```

> Se o banco já tinha produtos com estoque antes do controle de lote, rode uma única vez `node src/migrarLotesExistentes.js`.
> Problemas conhecidos do setup estão em [`README-PENDENCIAS.md`](./backend/README-PENDENCIAS.md).

A API ficará disponível em `http://localhost:3000`.

### 3. Front-end

Em outro terminal:

```bash
cd frontend

# instalar dependências
npm install

# iniciar o servidor de desenvolvimento
npm run dev
```

O Vite exibirá no terminal o endereço da aplicação (por padrão, `http://localhost:5173`). Mantenha o back-end rodando para que o front-end consiga se comunicar com a API.

Para gerar a versão de produção: `npm run build`.

### 4. Testes

```bash
cd backend
npm test
```

Os testes são unitários e não precisam de banco de dados, pois mockam os models e o pool de conexão.

## 🔐 Autenticação e permissões

O login é feito em `POST /auth/login` e retorna um token JWT, que deve ser enviado em todas as demais requisições:

```
Authorization: Bearer <token>
```

As permissões seguem o formato `recurso:acao` (ex.: `produtos:criar`):

| Papel | Acesso |
| ----- | ------ |
| `admin` | todas as permissões |
| `gerente` | tudo, exceto criar, editar e excluir funcionários |
| `funcionario` | consulta de categorias e produtos; clientes (ver, criar, editar); entradas, saídas, ajustes e devoluções (ver e criar); dashboard; PDV (vender e visualizar) |

## 🔗 Principais endpoints

| Recurso | Rota base | Descrição |
| ------- | --------- | --------- |
| Autenticação | `/auth` | login e registro de funcionários |
| Categorias | `/categorias` | CRUD de categorias |
| Produtos | `/produtos` | CRUD, ativar e desativar produtos |
| Funcionários | `/funcionarios` | CRUD de funcionários |
| Clientes | `/clientes` | CRUD de clientes |
| Entradas | `/entradas` | entradas de estoque com geração de lotes |
| Saídas | `/saidas` | saídas com baixa de estoque e de lote |
| Ajustes | `/ajustes` | ajustes manuais de estoque |
| Devoluções | `/devolucoes` | registro de devoluções |
| Lotes | `/lotes` | consulta por produto e lotes a vencer |
| PDV | `/pdv` | busca de produtos, registro de vendas e recibo |
| Dashboard | `/dashboard` | indicadores e dados para os gráficos |

Exemplo de venda no PDV:

```json
POST /pdv/vendas
{
  "id_cliente": 5,
  "desconto": 2.00,
  "itens": [{ "id_produto": 10, "quantidade": 3 }],
  "pagamentos": [{ "forma": "dinheiro", "valor": 50.00 }]
}
```

## 🗄️ Modelo de dados

| Tabela | Descrição |
| ------ | --------- |
| `tbl_categorias`, `tbl_produtos` | catálogo de produtos e categorias |
| `tbl_funcionario`, `tbl_roles`, `tbl_permissoes`, `tbl_role_permissao` | usuários, papéis e permissões |
| `tbl_clientes` | clientes |
| `tbl_entrada`, `tbl_item_entrada`, `tbl_lote` | entradas de estoque e lotes com validade |
| `tbl_saida`, `tbl_item_saida`, `tbl_saida_lote` | saídas, itens e consumo de lotes |
| `tbl_pagamento` | pagamentos das vendas do PDV |
| `tbl_ajuste` | ajustes manuais de estoque |
| `tbl_devolucao`, `tbl_item_devolucao` | devoluções |

## 📸 Demonstração

<!-- Adicione aqui prints das telas: login, dashboard, PDV, cadastro de produtos... -->

```markdown
![Dashboard](./docs/dashboard.png)
![PDV](./docs/pdv.png)
```

## 👥 Equipe

Projeto desenvolvido por:

| Integrante |
| ---------- |
| **Agatha Helena Silva Monteiro** |
| **Emanuely Macedo Padovan** |
| **Jonas Daniel de Brito Lopes** |
| **Sofia Marcolongo dos Santos** |
| **Yasmin Vitória do Nascimento Ramos** |

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](./backend/LICENSE) para mais detalhes.

---

<div align="center">
Feito com 💙 pela equipe TechParts
</div>
