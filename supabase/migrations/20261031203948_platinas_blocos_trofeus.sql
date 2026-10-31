-- Tarefa 7.0, item 1: troféus nos blocos da PSN (jogo base = 'default', DLCs = '001', '002'...).
-- A platina vale só pelo jogo base; 100% = todos os blocos (progresso_pct da PSN).
alter table platinas.trophies add column grupo_id text not null default 'default';
alter table platinas.games add column grupos jsonb not null default '[]'::jsonb;  -- [{ "id": "default", "nome": "..." }, ...] na ordem da PSN
alter table platinas.games add column platinado boolean not null default false;  -- a platina (jogo base) foi conquistada
