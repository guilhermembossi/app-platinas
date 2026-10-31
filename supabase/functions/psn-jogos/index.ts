// Tarefa 2.3: buscar jogos entre os títulos da conta PSN e adicionar um jogo
// (jogo + todos os troféus em PT e EN + o progresso do Guilherme).
// POST { acao: "buscar", termo }                    → { jogos: [...] }
// POST { acao: "adicionar", np_communication_id }   → { jogo: {...} } (e procura o guia, tarefa 4.1)
// POST { acao: "sincronizar", game_id? }            → { atualizados, falharam } (tarefa 5.1)
// Nunca devolve nem registra tokens.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';
import {
  getTitleTrophies,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  type TrophyTitle,
} from 'npm:psn-api@2.18.1';
import { cabecalhosCors } from '../_shared/cors.ts';
import { acharGuia } from '../_shared/guia.ts';
import { obterAcessoPsn, PsnTokenExpirado } from '../_shared/psn.ts';

type Acesso = { accessToken: string };

const TIPOS: Record<string, string> = { bronze: 'bronze', silver: 'prata', gold: 'ouro', platinum: 'platina' };
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

// Todos os títulos com troféu da conta (paginado; 800 é o máximo por página).
async function titulosDaConta(acesso: Acesso): Promise<TrophyTitle[]> {
  const titulos: TrophyTitle[] = [];
  let offset = 0;
  while (true) {
    const pagina = await getUserTitles(acesso, 'me', { limit: 800, offset });
    titulos.push(...pagina.trophyTitles);
    if (pagina.nextOffset === undefined || pagina.trophyTitles.length === 0) break;
    offset = pagina.nextOffset;
  }
  return titulos;
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

// Grava (ou atualiza) um jogo e todos os troféus dele a partir do título da PSN.
// Usado por adicionar e sincronizar. O guia só é procurado ao adicionar (`procurarGuia`).
async function gravarJogo(
  admin: SupabaseClient,
  userId: string,
  acesso: Acesso,
  titulo: TrophyTitle,
  procurarGuia: boolean,
) {
  const npId = titulo.npCommunicationId;
  const opcoes = { npServiceName: titulo.npServiceName };
  const [pt, en, meus] = await Promise.all([
    getTitleTrophies(acesso, npId, 'all', { ...opcoes, headerOverrides: { 'Accept-Language': 'pt-BR' } }),
    getTitleTrophies(acesso, npId, 'all', { ...opcoes, headerOverrides: { 'Accept-Language': 'en-US' } }),
    getUserTrophiesEarnedForTitle(acesso, 'me', npId, 'all', opcoes),
  ]);
  const ingles = new Map(en.trophies.map((t) => [t.trophyId, t]));
  const ganhos = new Map(meus.trophies.map((t) => [t.trophyId, t]));

  const agora = new Date().toISOString();
  const { data: jogo, error: erroJogo } = await admin
    .from('games')
    .upsert(
      {
        user_id: userId,
        np_communication_id: npId,
        np_service_name: titulo.npServiceName,
        nome: titulo.trophyTitleName,
        plataforma: titulo.trophyTitlePlatform,
        icone_url: titulo.trophyTitleIconUrl,
        progresso_pct: titulo.progress,
        ultima_sync: agora,
      },
      { onConflict: 'user_id,np_communication_id' },
    )
    .select('id, guia_url, guia_fonte')
    .single();
  if (erroJogo || !jogo) throw new Error('falha ao gravar o jogo');

  // Sem is_missable/missable_origem: adicionar de novo não apaga a marcação de missable.
  const trofeus = pt.trophies.map((t) => {
    const e = ingles.get(t.trophyId);
    const g = ganhos.get(t.trophyId);
    return {
      game_id: jogo.id,
      user_id: userId,
      trophy_id: t.trophyId,
      nome: t.trophyName ?? e?.trophyName ?? '',
      nome_en: e?.trophyName ?? null,
      descricao: t.trophyDetail ?? null,
      descricao_en: e?.trophyDetail ?? null,
      tipo: TIPOS[t.trophyType],
      icone_url: t.trophyIconUrl ?? null,
      oculto: t.trophyHidden,
      conquistado: g?.earned ?? false,
      conquistado_em: g?.earned ? g.earnedDateTime ?? null : null,
    };
  });
  const { error: erroTrofeus } = await admin.from('trophies').upsert(trofeus, { onConflict: 'game_id,trophy_id' });
  if (erroTrofeus) throw new Error('falha ao gravar os troféus');

  // Guia (tarefa 4.1): só procura se o jogo ainda não tem; adicionar de novo não troca o link.
  let guia = jogo.guia_url ? { url: jogo.guia_url, fonte: jogo.guia_fonte } : null;
  if (!guia && procurarGuia) {
    guia = await acharGuia(titulo.trophyTitleName);
    if (guia) await admin.from('games').update({ guia_url: guia.url, guia_fonte: guia.fonte }).eq('id', jogo.id);
  }

  return { id: jogo.id as string, trofeus, guia };
}

async function adicionar(admin: SupabaseClient, userId: string, acesso: Acesso, npId: string) {
  // Só jogos que estão na conta: o título também traz nome, ícone, plataforma e o % da PSN.
  const titulo = (await titulosDaConta(acesso)).find((t) => t.npCommunicationId === npId);
  if (!titulo) return resposta({ status: 'nao_encontrado' }, 404);

  const { id, trofeus, guia } = await gravarJogo(admin, userId, acesso, titulo, true);
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

// Tarefa 5.1: atualiza o progresso e os troféus dos jogos adicionados (todos, ou só `gameId`).
// Uma busca da lista de títulos para todos; um jogo com erro não impede os outros.
async function sincronizar(admin: SupabaseClient, userId: string, acesso: Acesso, gameId?: string) {
  let consulta = admin.from('games').select('id, np_communication_id').eq('user_id', userId);
  if (gameId) consulta = consulta.eq('id', gameId);
  const { data: jogos, error } = await consulta;
  if (error) throw new Error('falha ao ler os jogos');
  if (gameId && jogos.length === 0) return { status: 'nao_encontrado', atualizados: 0, falharam: 0 };

  const titulos = new Map((await titulosDaConta(acesso)).map((t) => [t.npCommunicationId, t]));
  let atualizados = 0;
  let falharam = 0;
  for (const jogo of jogos) {
    const titulo = titulos.get(jogo.np_communication_id);
    if (!titulo) { falharam++; continue; }
    try {
      await gravarJogo(admin, userId, acesso, titulo, false);
      atualizados++;
    } catch {
      falharam++;
    }
  }
  return { status: 'ok', atualizados, falharam };
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

  let corpo: { acao?: string; termo?: string; np_communication_id?: string; game_id?: string };
  try {
    corpo = await req.json();
  } catch {
    return resposta({ status: 'pedido_invalido' }, 400);
  }

  try {
    const { accessToken } = await obterAcessoPsn(admin, user.id);
    const acesso = { accessToken };
    if (corpo.acao === 'buscar') return await buscar(admin, user.id, acesso, corpo.termo ?? '');
    if (corpo.acao === 'adicionar' && corpo.np_communication_id) {
      return await adicionar(admin, user.id, acesso, corpo.np_communication_id);
    }
    if (corpo.acao === 'sincronizar') {
      const r = await sincronizar(admin, user.id, acesso, corpo.game_id);
      return resposta(r, r.status === 'nao_encontrado' ? 404 : 200);
    }
    return resposta({ status: 'pedido_invalido' }, 400);
  } catch (e) {
    if (e instanceof PsnTokenExpirado) return resposta({ status: 'token_expirado' }, 401);
    console.error('psn-jogos: erro interno', e instanceof Error && e.message.startsWith('falha') ? e.message : '');
    return resposta({ status: 'erro' }, 500);
  }
}
