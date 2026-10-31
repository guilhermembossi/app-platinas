// Gravação de jogos e troféus vindos da PSN: usada pela psn-jogos (adicionar e o botão
// Sincronizar, tarefa 5.1) e pela psn-sync-diaria (tarefa 5.2).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';
import {
  getProfileFromAccountId,
  getTitleTrophies,
  getTitleTrophyGroups,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getUserTrophyProfileSummary,
  type TrophyTitle,
} from 'npm:psn-api@2.18.1';
import { acharGuia } from './guia.ts';

export type Acesso = { accessToken: string };

const TIPOS: Record<string, string> = { bronze: 'bronze', silver: 'prata', gold: 'ouro', platinum: 'platina' };

// Todos os títulos com troféu da conta (paginado; 800 é o máximo por página).
export async function titulosDaConta(acesso: Acesso): Promise<TrophyTitle[]> {
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

// Grava (ou atualiza) um jogo e todos os troféus dele a partir do título da PSN.
// O guia só é procurado ao adicionar (`procurarGuia`).
export async function gravarJogo(
  admin: SupabaseClient,
  userId: string,
  acesso: Acesso,
  titulo: TrophyTitle,
  procurarGuia: boolean,
) {
  const npId = titulo.npCommunicationId;
  const opcoes = { npServiceName: titulo.npServiceName };
  const [pt, en, meus, blocos] = await Promise.all([
    getTitleTrophies(acesso, npId, 'all', { ...opcoes, headerOverrides: { 'Accept-Language': 'pt-BR' } }),
    getTitleTrophies(acesso, npId, 'all', { ...opcoes, headerOverrides: { 'Accept-Language': 'en-US' } }),
    getUserTrophiesEarnedForTitle(acesso, 'me', npId, 'all', opcoes),
    getTitleTrophyGroups(acesso, npId, { ...opcoes, headerOverrides: { 'Accept-Language': 'pt-BR' } }),
  ]);
  const ingles = new Map(en.trophies.map((t) => [t.trophyId, t]));
  const ganhos = new Map(meus.trophies.map((t) => [t.trophyId, t]));
  // Blocos da PSN (7.0 item 1): 'default' = jogo base, '001', '002'... = DLCs, na ordem da PSN.
  const grupos = blocos.trophyGroups.map((g) => ({ id: g.trophyGroupId, nome: g.trophyGroupName }));
  // A platina só existe no jogo base; platinado = ela foi conquistada (100% é o progresso da PSN).
  const platinado = pt.trophies.some((t) => t.trophyType === 'platinum' && ganhos.get(t.trophyId)?.earned);
  // "X de Y troféus" do card de Meus jogos (7.0 item 5).
  const trofeusConquistados = pt.trophies.filter((t) => ganhos.get(t.trophyId)?.earned).length;

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
        grupos,
        platinado,
        trofeus_total: pt.trophies.length,
        trofeus_conquistados: trofeusConquistados,
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
      grupo_id: t.trophyGroupId ?? 'default',
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

// Perfil PSN para a aba Resumo (7.0 item 3): números da conta inteira. "completos" = jogos da conta com 100%.
async function gravarPerfil(admin: SupabaseClient, userId: string, acesso: Acesso, titulos: TrophyTitle[]) {
  // O perfil não aceita "me": precisa do número da conta, que vem no resumo de troféus.
  const resumo = await getUserTrophyProfileSummary(acesso, 'me');
  const perfil = await getProfileFromAccountId(acesso, resumo.accountId);
  // O maior avatar que a PSN tiver.
  const avatar = [...perfil.avatars].sort((a, b) => parseInt(b.size) - parseInt(a.size))[0]?.url ?? null;
  const { error } = await admin.from('psn_profile').upsert({
    user_id: userId,
    online_id: perfil.onlineId,
    avatar_url: avatar,
    nivel: Number(resumo.trophyLevel) || 0,
    nivel_progresso: resumo.progress,
    platinas: resumo.earnedTrophies.platinum,
    completos: titulos.filter((t) => t.progress === 100).length,
    ouro: resumo.earnedTrophies.gold,
    prata: resumo.earnedTrophies.silver,
    bronze: resumo.earnedTrophies.bronze,
    atualizado_em: new Date().toISOString(),
  });
  if (error) throw new Error('falha ao gravar o perfil');
}

// Atualiza o progresso e os troféus dos jogos adicionados (todos, ou só `gameId`) e, sincronizando
// todos, o perfil PSN. Uma busca da lista de títulos para tudo; um jogo com erro não impede os outros.
export async function sincronizar(admin: SupabaseClient, userId: string, acesso: Acesso, gameId?: string) {
  let consulta = admin.from('games').select('id, np_communication_id').eq('user_id', userId);
  if (gameId) consulta = consulta.eq('id', gameId);
  const { data: jogos, error } = await consulta;
  if (error) throw new Error('falha ao ler os jogos');
  if (gameId && jogos.length === 0) return { status: 'nao_encontrado', atualizados: 0, falharam: 0 };

  const lista = await titulosDaConta(acesso);
  const titulos = new Map(lista.map((t) => [t.npCommunicationId, t]));
  if (!gameId) {
    try {
      await gravarPerfil(admin, userId, acesso, lista);
    } catch (e) {
      // Não impede a sincronização dos jogos. A mensagem é da PSN ou nossa ("falha ..."), sem tokens.
      console.error('sync: perfil não atualizado:', e instanceof Error ? e.message.slice(0, 200) : '');
    }
  }
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
