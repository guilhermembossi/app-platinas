-- Tarefa 1.2: o visitante não vê nada; o 2º usuário não vê nem altera nada do 1º;
-- psn_auth só o servidor (service_role) acessa.
-- Cria dois usuários de teste (sem senha) e age como cada um, do mesmo jeito que a API faz
-- (papel "authenticated" + o id do usuário no token). No fim levanta um erro de propósito:
-- o resultado sai na mensagem e TUDO é desfeito (nenhum usuário ou dado de teste fica no banco).
-- Rodar no SQL do Supabase (MCP execute_sql ou SQL Editor). Esperado: "20 OK, 0 FALHOU".
do $$
declare
  u1 uuid := gen_random_uuid();  u2 uuid := gen_random_uuid();
  g1 uuid := gen_random_uuid();  t1 uuid := gen_random_uuid();
  g2 uuid := gen_random_uuid();  t2 uuid := gen_random_uuid();
  r    text[] := '{}';
  n    bigint;
  ok   int := 0;
  ruim int := 0;
  tab  text;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at) values
    ('00000000-0000-0000-0000-000000000000', u1, 'authenticated', 'authenticated', 'teste1@exemplo.invalid', now(), now()),
    ('00000000-0000-0000-0000-000000000000', u2, 'authenticated', 'authenticated', 'teste2@exemplo.invalid', now(), now());

  -- Usuário 1 adiciona um jogo com um troféu --------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into platinas.games (id, np_communication_id, nome) values (g1, 'NPWR00001_00', 'Jogo do 1');
  insert into platinas.trophies (id, game_id, trophy_id, nome, tipo) values (t1, g1, 0, 'Platina do 1', 'platina');
  select (select count(*) from platinas.games) + (select count(*) from platinas.trophies) into n;
  if n = 2 then ok := ok + 1; r := r || text 'OK      usuário 1 vê o próprio jogo e troféu';
  else ruim := ruim + 1; r := r || ('FALHOU  usuário 1 vê ' || n || ' registros (esperado 2)'); end if;

  begin perform count(*) from platinas.psn_auth;
    ruim := ruim + 1; r := r || text 'FALHOU  usuário 1 leu psn_auth';
  exception when insufficient_privilege then ok := ok + 1; r := r || text 'OK      usuário 1 lê psn_auth: recusado'; end;

  begin insert into platinas.psn_auth (user_id, refresh_token, refresh_expira_em) values (u1, 'x', now());
    ruim := ruim + 1; r := r || text 'FALHOU  usuário 1 gravou em psn_auth';
  exception when insufficient_privilege then ok := ok + 1; r := r || text 'OK      usuário 1 grava em psn_auth: recusado'; end;

  -- Usuário 2 tenta ler, alterar e apagar os dados do 1 ----------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  foreach tab in array array['games', 'trophies'] loop
    execute format('select count(*) from platinas.%I', tab) into n;
    if n = 0 then ok := ok + 1; r := r || ('OK      usuário 2 lê ' || tab || ': 0 linhas');
    else ruim := ruim + 1; r := r || ('FALHOU  usuário 2 lê ' || tab || ': ' || n || ' linhas'); end if;

    execute format('update platinas.%I set nome = ''x'' where true', tab);
    get diagnostics n = row_count;
    if n = 0 then ok := ok + 1; r := r || ('OK      usuário 2 altera ' || tab || ': 0 linhas');
    else ruim := ruim + 1; r := r || ('FALHOU  usuário 2 altera ' || tab || ': ' || n || ' linhas'); end if;

    execute format('delete from platinas.%I where true', tab);
    get diagnostics n = row_count;
    if n = 0 then ok := ok + 1; r := r || ('OK      usuário 2 apaga ' || tab || ': 0 linhas');
    else ruim := ruim + 1; r := r || ('FALHOU  usuário 2 apaga ' || tab || ': ' || n || ' linhas'); end if;
  end loop;

  -- Usuário 2 tenta gravar em nome do 1 ou pendurar troféu no jogo do 1 -------------------
  begin insert into platinas.games (np_communication_id, nome, user_id) values ('NPWR00002_00', 'x', u1);
    ruim := ruim + 1; r := r || text 'FALHOU  usuário 2 criou jogo em nome do 1';
  exception when insufficient_privilege then ok := ok + 1; r := r || text 'OK      usuário 2 cria jogo em nome do 1: recusado'; end;

  begin insert into platinas.trophies (game_id, trophy_id, nome, tipo) values (g1, 1, 'x', 'bronze');
    ruim := ruim + 1; r := r || text 'FALHOU  usuário 2 pôs troféu no jogo do 1';
  exception when insufficient_privilege then ok := ok + 1; r := r || text 'OK      usuário 2 põe troféu no jogo do 1: recusado'; end;

  begin insert into platinas.trophies (game_id, trophy_id, nome, tipo, user_id) values (g1, 1, 'x', 'bronze', u1);
    ruim := ruim + 1; r := r || text 'FALHOU  usuário 2 pôs troféu no jogo do 1 em nome do 1';
  exception when insufficient_privilege then ok := ok + 1; r := r || text 'OK      usuário 2 põe troféu em nome do 1: recusado'; end;

  -- Usuário 2 cria as próprias coisas (deve conseguir) e tenta mudar o dono ou o jogo -----
  insert into platinas.games (id, np_communication_id, nome) values (g2, 'NPWR00001_00', 'Jogo do 2');
  insert into platinas.trophies (id, game_id, trophy_id, nome, tipo) values (t2, g2, 0, 'Platina do 2', 'platina');
  ok := ok + 1; r := r || text 'OK      usuário 2 cria o próprio jogo e troféu';

  begin update platinas.games set user_id = u1 where id = g2;
    ruim := ruim + 1; r := r || text 'FALHOU  usuário 2 passou o jogo dele para o 1';
  exception when insufficient_privilege then ok := ok + 1; r := r || text 'OK      usuário 2 passa o próprio jogo para o 1: recusado'; end;

  begin update platinas.trophies set game_id = g1 where id = t2;
    ruim := ruim + 1; r := r || text 'FALHOU  usuário 2 moveu troféu para o jogo do 1';
  exception when insufficient_privilege then ok := ok + 1; r := r || text 'OK      usuário 2 move troféu para o jogo do 1: recusado'; end;

  -- Visitante (sem login) ----------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  foreach tab in array array['games', 'trophies', 'psn_auth'] loop
    begin execute format('select count(*) from platinas.%I', tab) into n;
      ruim := ruim + 1; r := r || ('FALHOU  visitante leu ' || tab);
    exception when insufficient_privilege then ok := ok + 1; r := r || ('OK      visitante lê ' || tab || ': recusado'); end;
  end loop;

  -- Servidor (service_role, usado pelas Edge Functions) usa psn_auth ----------------------
  reset role;
  set local role service_role;
  insert into platinas.psn_auth (user_id, refresh_token, refresh_expira_em) values (u1, 'teste', now() + interval '60 days');
  select count(*) from platinas.psn_auth where user_id = u1 into n;
  if n = 1 then ok := ok + 1; r := r || text 'OK      servidor grava e lê psn_auth';
  else ruim := ruim + 1; r := r || text 'FALHOU  servidor não leu psn_auth'; end if;

  -- Usuário 1 confere que nada dele mudou ------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select (select count(*) from platinas.games where nome = 'Jogo do 1')
       + (select count(*) from platinas.trophies where nome = 'Platina do 1' and game_id = g1) into n;
  if n = 2 then ok := ok + 1; r := r || text 'OK      usuário 1 continua com jogo e troféu intactos';
  else ruim := ruim + 1; r := r || ('FALHOU  usuário 1 agora vê ' || n || ' registros'); end if;

  reset role;
  raise exception '%', E'RESULTADO (tudo desfeito, nada fica no banco)\n'
    || array_to_string(r, E'\n') || E'\n' || ok || ' OK, ' || ruim || ' FALHOU';
end $$;
