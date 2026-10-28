-- App Platinas: schema próprio, separado do public (dados do Cockpit).
-- Permissões e políticas ficam para a tarefa 1.2; sem grants, ninguém além do dono acessa.
create schema platinas;

create table platinas.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  np_communication_id text not null,
  np_service_name text not null default 'trophy2' check (np_service_name in ('trophy', 'trophy2')),
  nome text not null,
  plataforma text,
  icone_url text,
  guia_url text,
  guia_fonte text check (guia_fonte in ('powerpyx', 'psnprofiles', 'web')),
  progresso_pct smallint not null default 0 check (progresso_pct between 0 and 100),
  adicionado_em timestamptz not null default now(),
  ultima_sync timestamptz,
  unique (user_id, np_communication_id)
);

create table platinas.trophies (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references platinas.games (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trophy_id integer not null,
  nome text not null,
  nome_en text,
  descricao text,
  descricao_en text,
  tipo text not null check (tipo in ('bronze', 'prata', 'ouro', 'platina')),
  icone_url text,
  oculto boolean not null default false,
  conquistado boolean not null default false,
  conquistado_em timestamptz,
  is_missable boolean not null default false,
  missable_origem text check (missable_origem in ('auto', 'manual')),
  unique (game_id, trophy_id)
);

create index trophies_user_id_idx on platinas.trophies (user_id);

-- Só o servidor (Edge Functions) lê e grava aqui; nenhuma policy para o app (tarefa 1.2).
create table platinas.psn_auth (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  refresh_expira_em timestamptz not null,
  atualizado_em timestamptz not null default now()
);

alter table platinas.games enable row level security;
alter table platinas.trophies enable row level security;
alter table platinas.psn_auth enable row level security;
