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

## Status
- 0.1 (ambiente) e 0.2 (repositório e banco definido) feitas em 27/10/2026. 0.3 (este arquivo) em 27/10/2026.
