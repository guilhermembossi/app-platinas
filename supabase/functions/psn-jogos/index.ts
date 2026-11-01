// Tarefa 2.3: buscar jogos entre os títulos da conta PSN e adicionar um jogo
// (jogo + todos os troféus em PT e EN + o progresso do Guilherme).
// POST { acao: "buscar", termo }                    → { jogos: [...] }
// POST { acao: "adicionar", np_communication_id, sem_guia? } → { jogo: {...} } (e procura o guia, 4.1,
//      a não ser com sem_guia: o app pede o guia depois, para mostrar os passos, 7.0 item 8)
// POST { acao: "guia", game_id }                    → { guia } (procura o guia de um jogo já adicionado)
// POST { acao: "sincronizar", game_id? }            → { atualizados, falharam } (tarefa 5.1)
// Sincronizar e token vencido ficam em platinas.sync_log (origem "manual"), que o app lê (5.3).
// Nunca devolve nem registra tokens. A gravação fica em _shared/sync.ts.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';
import { cabecalhosCors } from '../_shared/cors.ts';
import { acharGuia } from '../_shared/guia.ts';
import { obterAcessoPsn, PsnTokenExpirado } from '../_shared/psn.ts';
import { type Acesso, gravarJogo, sincronizar, titulosDaConta } from '../_shared/sync.ts';

const MAX_RESULTADOS = 20;

function resposta(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// "Ação" e "acao" casam: sem acento e sem diferença de maiúsculas.
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

async function buscar(admin: SupabaseClient, userId: string, acesso: Acesso, termo: string) {
  const alvo = normalizar(termo);
  if (alvo.length < 2) return resposta({ status: 'termo_curto' }, 400);

  const titulos = (await titulosDaConta(acesso)).filter((t) => normalizar(t.trophyTitleName).includes(alvo));
  const { data: adicionados } = await admin.from('games').select('np_communication_id').eq('user_id', userId);
  const jaTem = new Set((adicionados ?? []).map((g) => g.np_communication_id));

  return resposta({
    status: 'ok',
    jogos: titulos.slice(0, MAX_RESULTADOS).map((t) => ({
      np_communication_id: t.npCommunicationId,
      nome: t.trophyTitleName,
      plataforma: t.trophyTitlePlatform,
      icone_url: t.trophyTitleIconUrl,
      progresso_pct: t.progress,
      ja_adicionado: jaTem.has(t.npCommunicationId),
    })),
  });
}

async function adicionar(admin: SupabaseClient, userId: string, acesso: Acesso, npId: string, comGuia: boolean) {
  // Só jogos que estão na conta: o título também traz nome, ícone, plataforma e o % da PSN.
  const titulo = (await titulosDaConta(acesso)).find((t) => t.npCommunicationId === npId);
  if (!titulo) return resposta({ status: 'nao_encontrado' }, 404);

  const { id, trofeus, guia } = await gravarJogo(admin, userId, acesso, titulo, comGuia);
  const conquistados = trofeus.filter((t) => t.conquistado).length;
  return resposta({
    status: 'ok',
    jogo: {
      id,
      nome: titulo.trophyTitleName,
      plataforma: titulo.trophyTitlePlatform,
      progresso_pct: titulo.progress,
      trofeus: trofeus.length,
      conquistados,
      guia,
      por_tipo: Object.fromEntries(
        ['platina', 'ouro', 'prata', 'bronze'].map((tipo) => {
          const doTipo = trofeus.filter((t) => t.tipo === tipo);
          return [tipo, { total: doTipo.length, conquistados: doTipo.filter((t) => t.conquistado).length }];
        }),
      ),
    },
  });
}

// Passo "guia" do Adicionar (7.0 item 8): o app adiciona sem guia e pede o guia em seguida, para mostrar
// cada passo quando ele termina. Só procura se o jogo ainda não tem; não precisa falar com a PSN.
async function procurarGuia(admin: SupabaseClient, userId: string, gameId: string) {
  const { data: jogo } = await admin.from('games').select('id, nome, guia_url, guia_fonte')
    .eq('id', gameId).eq('user_id', userId).maybeSingle();
  if (!jogo) return resposta({ status: 'nao_encontrado' }, 404);
  if (jogo.guia_url) return resposta({ status: 'ok', guia: { url: jogo.guia_url, fonte: jogo.guia_fonte } });
  const achado = await acharGuia(jogo.nome);
  if (achado) await admin.from('games').update({ guia_url: achado.url, guia_fonte: achado.fonte }).eq('id', jogo.id);
  return resposta({ status: 'ok', guia: achado });
}

// Toda resposta leva os cabeçalhos de CORS (o app chama do navegador, tarefa 3.3).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabecalhosCors(req) });
  const resp = await atender(req);
  for (const [k, v] of Object.entries(cabecalhosCors(req))) resp.headers.set(k, v);
  return resp;
});

async function atender(req: Request): Promise<Response> {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    db: { schema: 'platinas' },
    auth: { persistSession: false },
  });

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return resposta({ status: 'sem_login' }, 401);

  let corpo: { acao?: string; termo?: string; np_communication_id?: string; game_id?: string; sem_guia?: boolean };
  try {
    corpo = await req.json();
  } catch {
    return resposta({ status: 'pedido_invalido' }, 400);
  }

  try {
    if (corpo.acao === 'guia' && corpo.game_id) return await procurarGuia(admin, user.id, corpo.game_id);
    const { accessToken } = await obterAcessoPsn(admin, user.id);
    const acesso = { accessToken };
    if (corpo.acao === 'buscar') return await buscar(admin, user.id, acesso, corpo.termo ?? '');
    if (corpo.acao === 'adicionar' && corpo.np_communication_id) {
      return await adicionar(admin, user.id, acesso, corpo.np_communication_id, !corpo.sem_guia);
    }
    if (corpo.acao === 'sincronizar') {
      const r = await sincronizar(admin, user.id, acesso, corpo.game_id);
      if (r.status === 'ok') {
        await admin.from('sync_log').insert({ origem: 'manual', user_id: user.id, ...r });
      }
      return resposta(r, r.status === 'nao_encontrado' ? 404 : 200);
    }
    return resposta({ status: 'pedido_invalido' }, 400);
  } catch (e) {
    // Token vencido fica no registro: é ele que faz o app mostrar o aviso (tarefa 5.3).
    if (e instanceof PsnTokenExpirado) {
      await admin.from('sync_log').insert({ origem: 'manual', user_id: user.id, status: 'token_expirado' });
      return resposta({ status: 'token_expirado' }, 401);
    }
    console.error('psn-jogos: erro interno', e instanceof Error && e.message.startsWith('falha') ? e.message : '');
    return resposta({ status: 'erro' }, 500);
  }
}
