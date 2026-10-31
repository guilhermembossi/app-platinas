-- Tarefa 7.0, item 2: estrela para fixar o jogo no topo de "Meus jogos".
-- O app grava direto (a policy games_alterar já deixa o dono alterar); a sync não mexe nessa coluna.
alter table platinas.games add column fixado boolean not null default false;
