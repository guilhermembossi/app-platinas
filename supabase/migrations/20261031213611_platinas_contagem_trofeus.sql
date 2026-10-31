-- Tarefa 7.0, item 5: "PS5 · X de Y troféus" no card de Meus jogos.
-- A sync grava os totais no jogo (evita contar os troféus de todos os jogos a cada abertura do app).
alter table platinas.games add column trofeus_total integer not null default 0;
alter table platinas.games add column trofeus_conquistados integer not null default 0;

-- Preenche os jogos que já existem a partir dos troféus já gravados.
update platinas.games g set
  trofeus_total = (select count(*) from platinas.trophies t where t.game_id = g.id),
  trofeus_conquistados = (select count(*) from platinas.trophies t where t.game_id = g.id and t.conquistado);
