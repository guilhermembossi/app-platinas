-- Tarefa 7.1.1: idioma do app (pt ou en), escolhido na aba Resumo. Uma linha por usuário; sem linha = pt.
-- O dono lê, cria e altera a própria linha (não apaga). Visitante nada.
create table platinas.preferencias (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  idioma text not null default 'pt' check (idioma in ('pt', 'en')),
  atualizado_em timestamptz not null default now()
);
alter table platinas.preferencias enable row level security;
revoke all on platinas.preferencias from public, anon, authenticated;
grant select, insert, update on platinas.preferencias to authenticated;
grant all on platinas.preferencias to service_role;
create policy preferencias_ler on platinas.preferencias for select to authenticated
  using (user_id = (select auth.uid()));
create policy preferencias_criar on platinas.preferencias for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy preferencias_alterar on platinas.preferencias for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
