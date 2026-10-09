# Pendências e limitações — techparts-eletrônicos

Este documento reúne o que o projeto ainda exige e o que ele não faz hoje. Para instalar e usar a API, veja o [README.md](./README.md).

Revisão de 09/10/2026, feita por leitura do código e do schema, mais `npm audit`. Os itens marcados **(novo)** foram acrescentados nesta revisão. Nada foi executado contra um MySQL real, então os itens com "provavelmente" precisam de confirmação.

## Antes de publicar (bloqueadores)

- [x] **Trocar a senha do `admin`.** O schema cria o usuário `admin` com um hash de exemplo, e a senha original é fraca: dá para descobri-la a partir do hash, que está no repositório público. Gere um hash novo e atualize no banco. Remova o hash do `.sql` ou crie o admin por script que leia a senha de variável de ambiente.
  ```bash
  node -e "require('bcrypt').hash(process.argv[1],12).then(console.log)" 'SENHA_LONGA_E_UNICA'
  ```
  ```sql
  UPDATE tbl_funcionario SET senha_hash='<hash>' WHERE login='admin';
  ```
- [x] **Proteger as rotas de lotes.** `GET /lotes/produto/:id_produto` e `GET /lotes/vencendo` não passam por `auth` nem `autorizar`, ao contrário das demais. Em `src/routes/lotes.js`, aplique `router.use(auth)` e `autorizar("produtos", "visualizar")` por rota (a permissão exata é decisão sua).
- [x] **Limitar tentativas de login (novo).** `POST /auth/login` não tem rate limit. Use `express-rate-limit` em `/auth/login`. Atrás de proxy (Render, Railway, Nginx), configure também `app.set("trust proxy", 1)`, senão todos os usuários aparecem com o IP do proxy.
- [ ] **Definir um `JWT_SECRET` forte** (longo e aleatório) no `.env`. **(novo)** Valide no boot: se a variável não existir, o servidor deve abortar. Hoje o login só devolve 500.
- [ ] **Restringir o CORS.** `src/app.js` usa `origin: "*"`. Em produção, limite à origem do frontend. O risco é menor que o de cookies porque a API usa Bearer, mas a restrição continua necessária.
- [ ] **Checar se o funcionário continua ativo (novo).** O token carrega as permissões e `middlewares/auth.js` não consulta o banco. Um funcionário desativado mantém acesso até o token expirar (8h por padrão). Consulte `ativo` a cada requisição ou reduza `JWT_EXPIRES_IN`.
- [ ] **Usar o funcionário do token, não o do body (novo).** Saídas, entradas, ajustes e devoluções recebem `id_funcionario` no corpo da requisição, então qualquer usuário registra movimentações em nome de outro. Só o PDV usa `req.funcionario.id_funcionario`. Faça o mesmo nos demais.
- [ ] **Fuso horário (novo).** `dataLocalHoje()` em `pdvService` usa o fuso do servidor. Em nuvem (UTC), vendas depois das 21h de Brasília saem datadas no dia seguinte. Defina `TZ=America/Sao_Paulo` no deploy e confira o fuso do MySQL, já que o dashboard e `listarVencendo` usam `CURDATE()`.
- [ ] **Atualizar dependências (novo).** `npm audit` aponta `proxy-addr` (via Express) como crítico, por spoofing de IP. As falhas altas em `tar`/`bcrypt` afetam só a instalação, não o runtime. Rode `npm audit fix` e mova `jest` de `dependencies` para `devDependencies`.
- [ ] **Credenciais do banco (novo).** Um `.env` com `DB_USER=root` e uma senha trivial foi commitado entre maio e julho de 2026 e continua no histórico. Não reutilize essas credenciais em produção. Crie um usuário MySQL próprio, só com permissão no `db_techparts`.

## Integridade de estoque e vendas (novo)

- [ ] **Estoque editável direto.** `PUT /produtos/:id` aceita `quantidade_estoque` e ignora os lotes. `POST /produtos` com estoque inicial maior que zero também não cria lote. Nos dois casos a venda seguinte falha com 500 "Inconsistência entre estoque e lotes". Tire `quantidade_estoque` dos campos atualizáveis e deixe o estoque mudar só por entrada ou ajuste.
- [ ] **Validação numérica em produtos.** `parseNumero` aceita negativos e frações, mas `quantidade_estoque` e `quantidade_minima` são `INT`. Exija inteiro `>= 0` nas quantidades e `> 0` no preço.
- [ ] **Saída manual sem validação de quantidade.** `validarItens` em `saidaService` deixa passar `NaN` (`Number("abc") <= 0` é falso), o que vira erro de SQL (500). Frações como `0.5` passam e o `INT` arredonda. Reaproveite o `consolidarItens` do `pdvService`.
- [ ] **Saída manual sem preço.** Grava `preco_unitario = 0.00`, então qualquer funcionário baixa estoque sem registro financeiro. Decida se a saída manual continua existindo ou se passa a exigir preço ou motivo.
- [ ] **Devolução sem validação de negócio.** Não confere se a quantidade passa do vendido, se o produto pertence àquela saída, nem se o item já foi devolvido.
- [ ] **Deadlock em vendas simultâneas.** Os itens do PDV são processados na ordem recebida. Duas vendas com os mesmos produtos em ordens diferentes podem travar uma à outra (erro 1213 do MySQL), com resposta 500 e sem retry. Ordene `itens` por `id_produto` antes do loop.
- [ ] **Vendas e saídas anteriores ao PDV ficam com `preco_unitario = 0.00`.** Não existe preço histórico para recuperar, então relatórios de faturamento só valem a partir da migração `002_pdv.sql`.

## Funcionários e contas (novo)

- [ ] **`GET /funcionarios` quebrado.** O controller chama `listarTodas()` e o service exporta `listarTodos`, então a rota dá `TypeError` (500).
- [ ] **`POST /funcionarios` provavelmente falha.** O service insere só `nome_funcionario` e `ativo`, sem `login`, `senha_hash` e `id_role`, todos `NOT NULL`. Hoje o único caminho que funciona é `POST /auth/registrar`. Remova a rota duplicada ou faça-a delegar ao `authService.registrar`.
- [ ] **`DELETE /funcionarios/:id` falha para quem já movimentou.** É exclusão física e as FKs de entradas, saídas, ajustes e devoluções impedem. Use desativação (`ativo = 0`).
- [ ] **Sem troca de senha nem de papel pela API.** `PUT /funcionarios/:id` só altera nome e `ativo`. Implemente `PUT /funcionarios/:id/senha` e permita alterar `id_role` com `funcionarios:editar`.

## Robustez da API (novo)

- [ ] **`errorHandler` responde 500 a tudo que não é `AppError`.** JSON malformado e payload grande são erros 400/413 do body-parser, e erros de FK ou duplicidade do MySQL também viram "Erro interno". Respeite `erro.status` e `erro.statusCode`, e mapeie `ER_DUP_ENTRY` (409) e `ER_ROW_IS_REFERENCED_2` (409).
- [ ] **Endurecimento básico.** Adicione `helmet`, reduza `express.json({ limit })` de `10mb` para algo como `100kb`, habilite SSL na conexão com o banco se ele for remoto e registre quem fez cada operação (log de auditoria).
- [ ] **Higiene do repositório.** `node_modules` foi commitado no histórico em maio de 2026. Confirme que o `.gitignore` cobre `node_modules` e `.env` em todas as pastas, e adicione um `.env.example` sem valores reais.

## Problemas no setup do banco

- [ ] **`techparts-eletronicos.sql` falha em banco novo.** Há dois `ALTER TABLE tbl_funcionario`: o primeiro adiciona `login` e `senha_hash`; o segundo repete essas colunas e acrescenta `id_role`. A execução para com o erro 1060 (coluna duplicada). Solução: apagar o primeiro `ALTER` do arquivo.
- [ ] **`migrarLotesExistentes.js` depende do usuário `admin`.** O script procura o funcionário com login `admin` e aborta se ele não existir (por exemplo, se você o renomeou ou desativou). Ele só é necessário se o banco já tinha estoque antes do controle de lote.
- [ ] **Caminhos errados no README (novo).** O README manda rodar `migrations/002_pdv.sql`, mas o arquivo está em `src/migrations/`. Ele também aponta para `README-PENDENCIAS.md`; ajuste o link para o nome real deste arquivo.

## Funcionalidades que ainda não existem

- [ ] **Reposição de estoque em devolução.** `devolucaoService` só grava a devolução e seus itens. Não altera `quantidade_estoque` nem os lotes, então o estoque diverge a cada devolução.
- [ ] **Estorno ou cancelamento de venda.** Vale para o PDV e para a saída manual. Editar itens e excluir saída estão desabilitados (501) porque a reversão de estoque e lote não foi implementada. A mesma causa desabilita editar itens e excluir em entradas. Um estorno de venda precisa devolver as quantidades aos mesmos lotes de onde saíram (a tabela `tbl_saida_lote` guarda esse vínculo) e registrar o motivo.
- [ ] **Abertura e fechamento de caixa** no PDV (sangria, suprimento, conferência por forma de pagamento).
- [ ] **Emissão fiscal** (NFC-e/SAT ou equivalente).
- [ ] **`codigo_barras` no cadastro de produtos.** A coluna existe e o PDV busca por ela, mas `produtoService` não aceita o campo em criar e atualizar, então hoje só dá para preenchê-la direto no banco.
- [ ] **Frontend.** Não há interface; o PDV hoje só existe como API.

## Testes

- [ ] **Cinco suítes falham:** `ajusteService`, `categoriaService`, `devolucaoService`, `funcionarioService` e `loteService`. Dois motivos identificados:
  - `loteService.test.js` usa `jest.mock("../models/lote")`, caminho errado a partir de `__test__/services/`. O correto é `../../src/models/lote`.
  - `funcionarioService.test.js` chama `funcionarioService.atualizar`, que não existe no service.

  Não investiguei os motivos das outras três.

- [ ] **Sem teste de integração.** Os testes mockam models e pool, então não executam SQL. Foi assim que um defeito em `models/saida.js` passou despercebido: o model passava callback para `pool.promise().query`, e as consultas nunca terminavam. Vale ter ao menos um teste contra um MySQL real cobrindo venda, rollback e concorrência pelo último item do estoque.
- [ ] **Sem teste de autorização (novo).** Nenhum teste cobre as rotas. Um teste simples que percorre todas as rotas sem token e espera 401 teria pego o problema de `/lotes`.
