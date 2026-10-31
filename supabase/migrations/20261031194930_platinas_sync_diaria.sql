-- Tarefa 5.2: sincronização diária pelo pg_cron.
-- O pg_cron chama a Edge Function psn-sync-diaria (pg_net) com uma senha própria guardada no Vault.
-- A senha é gerada aqui dentro e nunca aparece em código, log ou terminal.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Registro de cada execução (manual = rodada à mão para testar; cron = a diária).
create table platinas.sync_log (
  id bigint generated always as identity primary key,
  executado_em timestamptz not null default now(),
  origem text not null check (origem in ('cron', 'manual')),
  user_id uuid references auth.users (id) on delete cascade,
  status text not null,
  atualizados integer not null default 0,
  falharam integer not null default 0
);
alter table platinas.sync_log enable row level security;
revoke all on platinas.sync_log from public, anon, authenticated;
grant all on platinas.sync_log to service_role;

select vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'hex'),
  'platinas_sync_token',
  'Senha da sync diária do App Platinas (pg_cron → psn-sync-diaria)'
);

-- A função confere a senha recebida sem nunca devolvê-la. Só o servidor (service_role) pode chamar.
create function platinas.conferir_token_sync(token text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'platinas_sync_token' and decrypted_secret = token
  );
$$;
revoke execute on function platinas.conferir_token_sync(text) from public, anon, authenticated;
grant execute on function platinas.conferir_token_sync(text) to service_role;
