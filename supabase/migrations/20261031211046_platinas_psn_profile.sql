-- Tarefa 7.0, item 3: perfil PSN para a aba Resumo (números da conta PSN inteira, não só dos jogos adicionados).
-- Grava só o servidor (na sincronização); o dono lê a própria linha.
create table platinas.psn_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  online_id text not null,
  avatar_url text,
  nivel integer not null default 0,
  nivel_progresso smallint not null default 0 check (nivel_progresso between 0 and 100),  -- % até o próximo nível
  platinas integer not null default 0,
  completos integer not null default 0,  -- jogos com 100%
  ouro integer not null default 0,
  prata integer not null default 0,
  bronze integer not null default 0,
  atualizado_em timestamptz not null default now()
);
alter table platinas.psn_profile enable row level security;
revoke all on platinas.psn_profile from public, anon, authenticated;
grant select on platinas.psn_profile to authenticated;
grant all on platinas.psn_profile to service_role;
create policy psn_profile_ler on platinas.psn_profile for select to authenticated
  using (user_id = (select auth.uid()));
