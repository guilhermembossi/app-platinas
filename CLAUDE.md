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
- RLS ligada nas 3 e **nenhuma policy nem grant** ainda (tarefa 1.2). O schema novo não recebe permissões automáticas (sem `pg_default_acl` neste projeto) e ainda não está em Exposed schemas.

## Status
- 0.1 (ambiente) e 0.2 (repositório e banco definido) feitas em 27/10/2026. 0.3 (este arquivo) em 27/10/2026. 1.1 (tabelas) em 28/10/2026.
