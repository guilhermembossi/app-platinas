-- Tarefa 7.0, item 10: raridade de cada troféu (% dos jogadores da PSN que têm o troféu).
-- Gravada pela sync a partir do trophyEarnedRate da PSN; null enquanto não sincronizar.
alter table platinas.trophies add column raridade_pct numeric(5,2) check (raridade_pct between 0 and 100);
