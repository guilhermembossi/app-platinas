-- Tarefa 5.3: o app lê o próprio registro de sincronização para avisar quando o token da PSN vencer.
-- Só leitura e só as linhas do usuário; gravar continua só pelo servidor. Não há segredo nessa tabela.
grant select on platinas.sync_log to authenticated;
create policy sync_log_ler on platinas.sync_log for select to authenticated
  using (user_id = (select auth.uid()));
create index sync_log_user_id_idx on platinas.sync_log (user_id, id desc);
