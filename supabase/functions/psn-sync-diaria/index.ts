// Tarefa 5.2: sincronização diária, chamada pelo pg_cron (job "platinas-sync-diaria").
// Sem login de usuário (verify_jwt desligado): quem chama tem que mandar a senha da sync
// no cabeçalho x-sync-token; ela é conferida no banco (platinas.conferir_token_sync, Vault).
// Sincroniza os jogos de cada usuário que tem jogos e grava uma linha em platinas.sync_log.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { obterAcessoPsn, PsnTokenExpirado } from '../_shared/psn.ts';
import { sincronizar } from '../_shared/sync.ts';

function resposta(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return resposta({ status: 'metodo_invalido' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    db: { schema: 'platinas' },
    auth: { persistSession: false },
  });

  const token = req.headers.get('x-sync-token') ?? '';
  const { data: valido } = await admin.rpc('conferir_token_sync', { token });
  if (!token || valido !== true) return resposta({ status: 'nao_autorizado' }, 401);

  const corpo = await req.json().catch(() => ({}));
  const origem = corpo?.origem === 'manual' ? 'manual' : 'cron';

  const { data: jogos, error } = await admin.from('games').select('user_id');
  if (error) return resposta({ status: 'erro' }, 500);
  const usuarios = [...new Set(jogos.map((j) => j.user_id as string))];

  const resultados = [];
  for (const userId of usuarios) {
    let linha = { status: 'erro', atualizados: 0, falharam: 0 };
    try {
      const { accessToken } = await obterAcessoPsn(admin, userId);
      const r = await sincronizar(admin, userId, { accessToken });
      linha = { status: r.status, atualizados: r.atualizados, falharam: r.falharam };
    } catch (e) {
      linha.status = e instanceof PsnTokenExpirado ? 'token_expirado' : 'erro';
    }
    await admin.from('sync_log').insert({ origem, user_id: userId, ...linha });
    resultados.push(linha);
  }
  return resposta({ status: 'ok', usuarios: usuarios.length, resultados });
});
