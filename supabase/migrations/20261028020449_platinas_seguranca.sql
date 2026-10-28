-- Tarefa 1.2: quem pode o quê no schema platinas.
-- Visitante (anon): nada. Usuário logado: só os próprios jogos e troféus. psn_auth: só o servidor.
revoke all on schema platinas from public, anon;
revoke all on all tables in schema platinas from public, anon, authenticated;

grant usage on schema platinas to authenticated, service_role;
grant select, insert, update, delete on platinas.games, platinas.trophies to authenticated;
grant all on all tables in schema platinas to service_role;

-- games: só o dono
create policy games_ler on platinas.games for select to authenticated
  using (user_id = (select auth.uid()));
create policy games_criar on platinas.games for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy games_alterar on platinas.games for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy games_apagar on platinas.games for delete to authenticated
  using (user_id = (select auth.uid()));

-- trophies: só o dono, e o jogo também tem que ser dele
create policy trophies_ler on platinas.trophies for select to authenticated
  using (user_id = (select auth.uid()));
create policy trophies_criar on platinas.trophies for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from platinas.games g where g.id = game_id and g.user_id = (select auth.uid()))
  );
create policy trophies_alterar on platinas.trophies for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from platinas.games g where g.id = game_id and g.user_id = (select auth.uid()))
  );
create policy trophies_apagar on platinas.trophies for delete to authenticated
  using (user_id = (select auth.uid()));

-- psn_auth: RLS ligada e nenhuma policy nem grant para anon/authenticated (só service_role).
