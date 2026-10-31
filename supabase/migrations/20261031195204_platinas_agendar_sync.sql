-- Tarefa 5.2: agenda a sincronização diária às 10:00 UTC (07:00 em Brasília).
-- A senha vem do Vault na hora da chamada; o job não guarda a senha no texto.
select cron.schedule(
  'platinas-sync-diaria',
  '0 10 * * *',
  $job$
  select net.http_post(
    url := 'https://edrychcjsnnstfmndkhf.supabase.co/functions/v1/psn-sync-diaria',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-token', (select decrypted_secret from vault.decrypted_secrets where name = 'platinas_sync_token')
    ),
    body := '{"origem":"cron"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);
