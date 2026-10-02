# Pendências e limitações — techparts-eletrônicos

Este documento reúne o que o projeto ainda exige e o que ele não faz hoje. Para instalar e usar a API, veja o [README.md](./README.md).

## Antes de usar fora de desenvolvimento

- [ ] **Proteger as rotas de lotes.** `GET /lotes/produto/:id_produto` e `GET /lotes/vencendo` não passam por `auth` nem `autorizar`, ao contrário das demais. Qualquer pessoa com acesso à API lê os lotes. Em `src/routes/lotes.js`, aplique `router.use(auth)` e `autorizar(...)` por rota (a permissão a exigir é uma decisão sua, por exemplo `produtos:visualizar`).
- [ ] **Trocar a senha do `admin`.** O schema cria o usuário `admin` com um hash de exemplo. Gere um novo hash bcrypt, ou crie outro administrador e desative este.
- [ ] **Restringir o CORS.** `src/app.js` usa `origin: "*"`. Em produção, limite à origem do frontend.
- [ ] **Definir um `JWT_SECRET` forte** (longo e aleatório) no `.env`.

## Problemas no setup do banco

- [ ] **`techparts-eletronicos.sql` falha em banco novo.** Há dois `ALTER TABLE tbl_funcionario`: o primeiro adiciona `login` e `senha_hash`; o segundo repete essas colunas e acrescenta `id_role`. A execução para com o erro 1060 (coluna duplicada). Solução: apagar o primeiro `ALTER` do arquivo.
- [ ] **`migrarLotesExistentes.js` depende do usuário `admin`.** O script procura o funcionário com login `admin` e aborta se ele não existir (por exemplo, se você o renomeou ou desativou). Ele só é necessário se o banco já tinha estoque antes do controle de lote.
- [ ] **Vendas e saídas anteriores ao PDV ficam com `preco_unitario = 0.00`.** Não existe preço histórico para recuperar, então relatórios de faturamento só valem a partir da migração `002_pdv.sql`.

## Funcionalidades que ainda não existem

- [ ] **Reposição de estoque em devolução.** `devolucaoService` só grava a devolução e seus itens. Não altera `quantidade_estoque` nem os lotes, então o estoque diverge a cada devolução.
- [ ] **Estorno ou cancelamento de venda.** Vale para o PDV e para a saída manual. Editar itens e excluir saída estão desabilitados (501) porque a reversão de estoque e lote não foi implementada. A mesma causa desabilita editar itens e excluir em entradas. Um estorno de venda precisa devolver as quantidades aos mesmos lotes de onde saíram (a tabela `tbl_saida_lote` guarda esse vínculo) e registrar o motivo.
- [ ] **Abertura e fechamento de caixa** no PDV (sangria, suprimento, conferência por forma de pagamento).
- [ ] **Emissão fiscal** (NFC-e/SAT ou equivalente).
- [ ] **`codigo_barras` no cadastro de produtos.** A coluna existe e o PDV busca por ela, mas `produtoService` não aceita o campo em criar e atualizar, então hoje só dá para preenchê-la direto no banco.
- [ ] **Frontend.** Não há interface; o PDV hoje só existe como API.

## Testes

- [ ] **Cinco suítes falham:** `ajusteService`, `categoriaService`, `devolucaoService`, `funcionarioService` e `loteService`. Dois motivos que identifiquei:
  - `loteService.test.js` usa `jest.mock("../models/lote")`, caminho errado a partir de `__test__/services/`. O correto é `../../src/models/lote`.
  - `funcionarioService.test.js` chama `funcionarioService.atualizar`, que não existe no service.

  Não investiguei os motivos das outras três.

- [ ] **Sem teste de integração.** Os testes mockam models e pool, então não executam SQL. Foi assim que um defeito em `models/saida.js` passou despercebido: o model passava callback para `pool.promise().query`, e as consultas nunca terminavam. Vale ter ao menos um teste contra um MySQL real cobrindo venda, rollback e concorrência pelo último item do estoque.
