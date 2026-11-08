import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { Textos } from '../i18n';

export type JogoDaConta = {
  np_communication_id: string;
  nome: string;
  plataforma: string;
  icone_url: string;
  progresso_pct: number;
  ja_adicionado: boolean;
};

// Chama a Edge Function psn-jogos e devolve o corpo; erro vira Error com o "status" da função
// (token_expirado, nao_encontrado, erro...) ou "sem_internet".
async function psnJogos<T>(corpo: Record<string, string | boolean>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('psn-jogos', { body: corpo });
  if (!error) return data as T;
  if (error instanceof FunctionsHttpError) {
    const detalhe = await error.context.json().catch(() => null);
    throw new Error(detalhe?.status ?? 'erro');
  }
  throw new Error(navigator.onLine ? 'erro' : 'sem_internet');
}

export async function buscarJogos(termo: string): Promise<JogoDaConta[]> {
  return (await psnJogos<{ jogos: JogoDaConta[] }>({ acao: 'buscar', termo })).jogos;
}

// Adicionar em dois passos (7.0 item 8): primeiro jogo e troféus, sem guia; depois o guia.
// Assim a tela marca cada passo quando ele termina de verdade.
export async function adicionarJogo(npCommunicationId: string): Promise<{ id: string; trofeus: number }> {
  const r = await psnJogos<{ jogo: { id: string; trofeus: number } }>(
    { acao: 'adicionar', np_communication_id: npCommunicationId, sem_guia: true });
  return r.jogo;
}

export type Guia = { url: string; fonte: string };

export async function procurarGuia(gameId: string): Promise<Guia | null> {
  return (await psnJogos<{ guia: Guia | null }>({ acao: 'guia', game_id: gameId })).guia;
}

// Atualiza progresso e troféus de todos os jogos, ou só de um (tarefa 5.1).
export async function sincronizarJogos(gameId?: string): Promise<{ atualizados: number; falharam: number }> {
  return psnJogos(gameId ? { acao: 'sincronizar', game_id: gameId } : { acao: 'sincronizar' });
}

// Mensagem pelo status da função, no idioma do app (7.1.1).
export const mensagemPsn = (e: unknown, t: Textos) => t.errosPsn[(e as Error).message] ?? t.erroPsn;
