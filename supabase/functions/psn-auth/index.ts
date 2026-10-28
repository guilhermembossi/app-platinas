// Tarefa 2.2: confere o acesso à PSN do usuário logado (e renova os tokens).
// Responde só o estado ("autenticado", "token_expirado"...), nunca tokens.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { obterAcessoPsn, PsnTokenExpirado } from '../_shared/psn.ts';

function resposta(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    db: { schema: 'platinas' },
    auth: { persistSession: false },
  });

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return resposta({ status: 'sem_login' }, 401);

  try {
    const { refreshExpiraEm } = await obterAcessoPsn(admin, user.id);
    return resposta({ status: 'autenticado', renovar_ate: refreshExpiraEm });
  } catch (e) {
    if (e instanceof PsnTokenExpirado) return resposta({ status: 'token_expirado' }, 401);
    console.error('psn-auth: erro interno', e instanceof Error && e.message.startsWith('falha') ? e.message : '');
    return resposta({ status: 'erro' }, 500);
  }
});
