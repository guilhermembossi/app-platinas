# Platinas (App Platinas)

App web instalável (PWA) para acompanhar no iPhone as platinas da PSN em andamento, sem digitar nada: troféus feitos e faltando, % de progresso, missables marcados e link do guia a um clique. Só os jogos que o Guilherme vai platinar (busca e adiciona). Só ele usa.

## Documentação (ler antes de trabalhar)
Fica no Obsidian, não neste repositório: `C:\Users\Guilherme Bossi\OneDrive\Documents\Obsidian Vault\Projetos\App Platinas\`
- `tarefas.md`: **fonte da verdade** do que fazer e em que ordem, com status.
- `arquitetura.md`: decisões, funcionalidades da V1, modelo de dados, segurança, "Já feito".

## Como responder
- Português, direto e curto. O Guilherme não é programador: passos manuais sempre numerados e simples.

## Regras para todas as tarefas
- Uma tarefa por vez, respeitando as dependências. Ao terminar, mostrar o resultado do teste e **esperar o OK do Guilherme** antes da próxima.
- **🛑 Parada manual:** quando um passo precisar do Guilherme (login, chave, clicar numa tela, conferir algo), parar, dar o passo a passo numerado e esperar ele confirmar. Nunca contornar.
- Repositório **público**: nenhuma credencial em arquivo versionado nem impressa no terminal. NPSSO e refresh token da PSN valem como a senha da conta; chave da API do Claude também. Ficam só nos secrets do Supabase / tabela do servidor.
- Não criar nada fora do que a tarefa pede.
- Ao fim de cada tarefa: atualizar este `CLAUDE.md`, o "Já feito" da `arquitetura.md` e o status no `tarefas.md`.
- Documentação do projeto só no Obsidian. Código só no Claude Code.
- Commits com o e-mail privado do GitHub (`346195156+guilhermembossi@users.noreply.github.com`, configurado só neste repositório).

## Stack
| Camada | Escolha |
|---|---|
| Tela | PWA (mesmo modelo do App Treino), tema escuro, mobile first |
| Hospedagem | GitHub Pages |
| Banco + login | Supabase `controle-financeiro-mercado` (id `edrychcjsnnstfmndkhf`, EUA `us-west-2`, plano grátis), **schema `platinas`** |
| Lógica no servidor | Supabase Edge Functions (guardam os segredos) |
| Agendamento | `pg_cron` (sync 1x por dia) |
| PSN | `psn-api` (npm, não oficial, versão fixada) |
| Missables | API do Claude, modelo barato (Haiku) |
| Código | GitHub `guilhermembossi/app-platinas` (público), pasta local `C:\projetos\app-platinas`, branch `main` |

## Ambiente (tarefa 0.1, 27/10/2026)
- Node 24.22.0, npm 11.19.1, Git 2.56.0, GitHub CLI 2.103.1 (login `guilhermembossi`, HTTPS).
- Supabase pelo MCP do Claude Code (sem Supabase CLI), igual ao App Treino.
- Pasta fora do OneDrive de propósito (dependências do npm).

## Supabase compartilhado (tarefa 0.2, 27/10/2026)
- O Supabase grátis dá **2 projetos por pessoa**, já usados por `app-treino` e `controle-financeiro-mercado`. Decisão do Guilherme: o App Platinas usa o `controle-financeiro-mercado`, num schema próprio `platinas`.
- **Nunca mexer no schema `public` desse projeto**: tem os dados de mercado do Cockpit Financeiro (`cdi`, `ipca`, `cambio`, `curvas_b3`, `calendario_divulgacoes`).
- A região é EUA e não dá para trocar (o Supabase não permite mudar a região de um projeto existente).

## Banco (tarefa 1.1, 28/10/2026)
- Migrações em `supabase/migrations/<versão>_<nome>.sql`, com a mesma versão que aparece no histórico do Supabase. Mudança de banco sempre por migração nova (`apply_migration`), nunca editando uma já aplicada. O histórico do projeto também tem as migrações do Cockpit (`tabelas_mercado` etc.): não mexer.
- Migração `20261028020002_platinas_tabelas`: schema `platinas` e as tabelas:
  - `games`: um por jogo adicionado; `unique (user_id, np_communication_id)`. `np_service_name` (`trophy2` PS5, `trophy` PS4/PS3/Vita) é exigido pela `psn-api` para buscar os troféus. `guia_fonte` só `powerpyx`, `psnprofiles` ou `web`.
  - `trophies`: filha de `games` (apagar o jogo apaga os troféus); `unique (game_id, trophy_id)`. Nome e descrição em PT (`nome`, `descricao`) e EN (`nome_en`, `descricao_en`, para cruzar com o guia). `tipo` em português (`bronze`, `prata`, `ouro`, `platina`). `missable_origem` `auto` ou `manual`. Tem `user_id` próprio para a RLS.
  - `psn_auth`: uma linha por usuário com o refresh token da PSN e a validade. **Só o servidor.**
- O schema novo não recebe permissões automáticas (sem `pg_default_acl` neste projeto): **tabela nova precisa de grant explícito** (ver 1.2). Ainda não está em Exposed schemas (Data API); fazer quando o app precisar ler (3.1).

## Segurança (tarefa 1.2, 28/10/2026)
- Migração `20261028020449_platinas_seguranca`. `anon`: nada (nem `usage` no schema). `authenticated`: `usage` + CRUD em `games` e `trophies`, com 4 policies por tabela (ler, criar, alterar, apagar), só do dono (`user_id = (select auth.uid())`). Em `trophies`, criar e alterar também exigem que o jogo seja do usuário. `service_role` (Edge Functions): tudo.
- `psn_auth`: RLS ligada, **nenhuma policy nem grant** para `anon`/`authenticated`. O Advisor mostra "RLS Enabled No Policy" (INFO) nela: **é de propósito**.
- Advisor também mostra um WARN em `public.gravar_mercado_pc` (função do Cockpit, chamada pelo `anon` com token): não é deste app, não mexer.
- Teste: `testes/teste_seguranca.sql` pelo `execute_sql`. Cria 2 usuários numa transação, age como cada um, como visitante e como servidor, e termina com `raise exception` de propósito (tudo desfeito). Esperado: "20 OK, 0 FALHOU". Tabela nova: incluir nas listas.
- Rodar depois de toda mudança de banco, junto com o Security Advisor (nenhum alerta novo além dos dois acima).

## Login (tarefa 1.3, 28/10/2026)
- Supabase Auth com e-mail e senha. **Cadastro aberto desligado** ("Allow new users to sign up" off, feito pelo Guilherme no painel): só existe o usuário do Guilherme, criado por ele no painel (Add user, Auto Confirm). Sem anônimo nem outros provedores.
- O Auth é do projeto inteiro (compartilhado com o Cockpit, que não usa login). Usuário novo só pelo painel.
- Conferir sem conta: `GET /auth/v1/settings` com a chave publicável (`external.email`, `disable_signup`).
- Chave **publicável** do projeto: `sb_publishable_JQkktT37DPN-itwjI5DzmQ_0-27422V` (pode ir no app; nunca a `service_role`).
- Teste: `node testes/teste_login.mjs` (o Guilherme roda; pede e-mail e senha escondida, mostra só "LOGIN OK"/"LOGIN FALHOU", não guarda nada). O Claude não digita a senha.

## Token da PSN (tarefa 2.1, 28/10/2026)
- Secret `PSN_NPSSO` no Supabase (Edge Functions → Secrets), salvo pelo Guilherme no painel. Pegar de novo: logar em www.playstation.com e abrir `https://ca.account.sony.com/api/v1/ssocookie` (o valor de `npsso`, 64 caracteres). Não sair da conta no site depois (invalida o código).
- Dura ~60 dias. **Nunca** ler, imprimir ou registrar o valor (nem em log da função). O MCP não lista secrets: a prova de que está certo é a função da 2.2 responder "autenticado".
- Secrets são do projeto inteiro (o Cockpit não tem Edge Functions).

## Função de autenticação PSN (tarefa 2.2, 28/10/2026)
- Código em `supabase/functions/`. Publicar pelo MCP `deploy_edge_function` com os arquivos `psn-auth/index.ts` e `_shared/psn.ts` (entrypoint `psn-auth/index.ts`), `verify_jwt` ligado. Imports `npm:` com versão exata: `psn-api@2.18.1`, `@supabase/supabase-js@2.118.0`.
- `_shared/psn.ts` → `obterAcessoPsn(admin, userId)`: usa o refresh token de `psn_auth` se faltar mais de 1 dia para vencer; se não houver, vencer ou a PSN recusar, entra pelo `PSN_NPSSO`. Sempre grava o refresh token novo e a validade. Se o NPSSO também falhar: `PsnTokenExpirado` (base da tarefa 5.3). As próximas funções (2.3, 5.x) usam essa mesma função.
- `psn-auth`: confere o usuário pelo JWT e responde só `{"status":"autenticado","renovar_ate":…}`, `token_expirado` (401), `sem_login` (401) ou `erro` (500). **Nunca tokens, nem no log.**
- Cliente da função: `service_role` com `db: { schema: 'platinas' }`. Por isso o schema `platinas` está em **Exposed schemas** (Data API), incluído pelo Guilherme no painel. Visitante continua recusado (401, `42501`) nas 3 tabelas pela API.
- O refresh token da PSN veio com validade de **~10 dias** (não 2 meses): a sync diária (5.2) mantém renovado; se passar disso, a função cai no NPSSO sozinha.
- Teste: `node testes/teste_psn_auth.mjs` (o Guilherme roda com o e-mail e a senha **do Supabase**, não da PSN). Esperado: HTTP 200 `autenticado` e "Resposta sem tokens: OK".
- Advisor depois da 2.2: além dos dois avisos já conhecidos, apareceu "Leaked Password Protection Disabled" (recurso do plano Pro; cadastro fechado, só o Guilherme). Aceito igual ao App Treino.

## Buscar e adicionar jogo (tarefa 2.3, 28/10/2026)
- Edge Function `psn-jogos` (publicar com `psn-jogos/index.ts` + `_shared/psn.ts`, entrypoint `psn-jogos/index.ts`, `verify_jwt` ligado). POST com JSON:
  - `{ "acao": "buscar", "termo": "..." }` → até 20 jogos da conta cujo nome contém o termo (sem acento/maiúscula): `np_communication_id`, `nome`, `plataforma`, `icone_url`, `progresso_pct`, `ja_adicionado`.
  - `{ "acao": "adicionar", "np_communication_id": "..." }` → só aceita jogo que está na conta (senão `nao_encontrado`, 404). Grava `games` (upsert por usuário + jogo) e todos os troféus (`getTitleTrophies` "all" em `pt-BR` e `en-US`, `getUserTrophiesEarnedForTitle`). Devolve resumo: %, total, conquistados e por tipo.
- **% = o `progress` da própria PSN** (o mesmo do PS5, ponderado por tipo), não a conta de troféus.
- Troféus de **DLC entram junto** (grupo "all"), como no PS5. Ainda não guardamos o grupo do troféu.
- Adicionar de novo atualiza tudo **menos** `is_missable`/`missable_origem` (não vão no upsert).
- O mesmo jogo pode existir em PS4 e PS5 (são `np_communication_id` diferentes): a busca mostra os dois com a plataforma.
- Teste: `node testes/teste_jogo.mjs` (o Guilherme roda: e-mail e senha do Supabase, nome do jogo, número). Conferido com o PS5: Fallout 4 (PS5), 99%, 84 de 85.

## App (tarefa 3.1, 28/10/2026)
- Mesmo modelo do App Treino: React + Vite + TypeScript, PWA. Versões fixas (`--save-exact`): React 19.3.1, Vite 8.3.5, plugin-react 6.1.2, TypeScript 5.9.3, supabase-js 2.118.0, sharp 0.35.5 (só para os ícones). Node 24 (`.node-version`).
- **Marca:** `src/config/marca.ts` (nome, descrição, paleta **só escura**, logo de troféu em `logoSvg`). O plugin `marcaNoApp` do `vite.config.ts` põe isso no `index.html` (`%NOME%` etc. e as variáveis CSS) e gera o `manifest.webmanifest`. Ícones em `public/icones/` saem de `npm run icones`. CSS usa só as variáveis (`var(--primaria)`); nenhuma cor fora do `marca.ts`.
- `BASE` = `/app-platinas/` (GitHub Pages, `https://guilhermembossi.github.io/app-platinas/`); a variável de ambiente `BASE` troca.
- `src/config/supabase.ts`: URL, chave **publicável** e `ESQUEMA = 'platinas'`. `src/supabase.ts`: cliente (sessão no `localStorage`, renovação automática, `db.schema` platinas) e `mensagemDeErro`.
- `src/sessao.ts` (`useSessao`): sem sessão → `telas/Acesso.tsx` (só **Entrar**; sem criar conta nem esqueci a senha, porque o cadastro está fechado). Com sessão → `Casca` provisória em `App.tsx` (e-mail + Sair); a lista de jogos entra na 3.2.
- Ainda sem service worker (abrir sem internet não é requisito da V1).
- Testar local: `npm run build` e `npx vite preview --port 4173 --host 127.0.0.1 --strictPort` → http://127.0.0.1:4173/app-platinas/. O `preview_start` do navegador interno não achou o `launch.json` desta pasta; rodar o preview em segundo plano e navegar direto.

## Tela inicial (tarefa 3.2, 28/10/2026)
- `telas/Inicio.tsx` ("Meus jogos"): um cartão por jogo (ícone da PSN, nome, %, barra, "PS5 · sincronizado hoje às 00:19"), botão "+ Adicionar jogo" (`#/adicionar`), estado vazio e de erro com "Tentar de novo". E-mail e Sair no rodapé. 100% deixa o número na cor primária.
- `dados/jogos.ts`: `useJogos()` lê `games` direto do Supabase (a RLS filtra pelo usuário), ordem de `adicionado_em`; `quando(iso)` = "hoje/ontem às HH:MM" ou "DD/MM às HH:MM" (horário do aparelho).
- Navegação pelo `#` em `App.tsx` (`Casca`): `#/adicionar` mostra só um aviso até a 3.3. O logo no topo volta para o início.
- Ícones dos jogos vêm direto do servidor de imagens da PSN (`icone_url`).

## Busca e adicionar na tela (tarefa 3.3, 28/10/2026)
- `telas/Adicionar.tsx` (`#/adicionar`): campo + Buscar ("Buscando…"), resultados com ícone, plataforma, %, botão Adicionar ("Adicionando…", trava os outros) ou "Já adicionado". Ao adicionar volta para `#/` (o Início recarrega a lista).
- `dados/psn.ts`: `buscarJogos`, `adicionarJogo` (via `supabase.functions.invoke('psn-jogos')`) e `mensagemPsn` (status da função → português; `token_expirado` já tem texto, a tela própria é a 5.3).
- **CORS:** `_shared/cors.ts` aceita só `https://guilhermembossi.github.io`, `http://127.0.0.1:4173` e `:5173` (e, desde a 3.4, a rede de casa). `psn-jogos` responde o `OPTIONS` e põe os cabeçalhos em toda resposta (a lógica fica em `atender`). Endereço novo do app = incluir aqui e publicar de novo as funções. Publicar `psn-jogos` agora leva 3 arquivos: `psn-jogos/index.ts`, `_shared/psn.ts`, `_shared/cors.ts`.
- Conferido: Kingdom Two Crowns (PS4, `trophy`) adicionado pela tela, 47 troféus. PS4 e PS5 funcionam.
- Depois de publicar uma versão nova no PC, o navegador pode guardar a antiga: Ctrl+F5.

## Tela do jogo (tarefa 3.4, 28/10/2026)
- `telas/Jogo.tsx` (`#/jogo/<id>`, os cartões do Início são links): topo com ícone, nome, %, barra, "X de Y troféus" e última sync; botão **Abrir guia** (abre `guia_url` em outra aba; sem link fica desligado "Guia ainda não encontrado", até a 4.1); filtros **Todos / Faltando / Missables** com contagem; lista na ordem da PSN (`trophy_id`) com ícone, bolinha do tipo, nome, descrição e etiquetas (Conquistado em DD/MM/AAAA ou Faltando, Missable, Oculto). Conquistados ficam mais apagados.
- `dados/trofeus.ts`: `useJogo(id)` (jogo + troféus direto do Supabase; id de outro usuário → "não encontrado") e `filtrar`.
- Cores dos tipos de troféu (`platina`, `ouro`, `prata`, `bronze`) no `marca.ts`, viram `var(--ouro)` etc.
- **Testar no iPhone pela rede de casa:** o Guilherme roda no terminal dele `cd C:\projetos\app-platinas; npx.cmd vite preview --port 4173 --host 0.0.0.0` e abre `http://192.168.15.11:4173/app-platinas/` no Safari (mesmo Wi-Fi). Precisa: Wi-Fi **AP122 como "Rede privada"** (estava Pública e o Firewall bloqueava o Node; o Guilherme mudou) e Node permitido em redes privadas. O Claude Code não consegue abrir a porta para a rede (sandbox). No PowerShell do Guilherme, `npx` (.ps1) é bloqueado: usar **`npx.cmd`**. CORS da `psn-jogos` aceita IPs `192.168.x.x`/`10.x` nas portas 4173/5173.
- Em 28/10/2026 o `node_modules/vite` ficou sem a pasta `bin` ("'vite' não é reconhecido"): `npm ci` resolveu.

## Status
- 0.1 (ambiente) e 0.2 (repositório e banco definido) feitas em 27/10/2026. 0.3 (este arquivo) em 27/10/2026. 1.1 (tabelas), 1.2 (segurança), 1.3 (login), 2.1 (secret do NPSSO), 2.2 (função psn-auth) e 2.3 (buscar e adicionar jogo) em 28/10/2026. **Fase 2 concluída.** 3.1 (base PWA), 3.2 (tela inicial), 3.3 (busca e adicionar) e 3.4 (tela do jogo, conferida no iPhone) em 28/10/2026. **Fase 3 concluída.**
