import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../supabase';

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
async function psnJogos<T>(corpo: Record<string, string>): Promise<T> {
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

export async function adicionarJogo(npCommunicationId: string): Promise<void> {
  await psnJogos({ acao: 'adicionar', np_communication_id: npCommunicationId });
}

const MENSAGENS: Record<string, string> = {
  token_expirado: 'O acesso à PSN venceu. Gere um NPSSO novo e salve no Supabase.',
  nao_encontrado: 'Esse jogo não está mais na sua conta PSN.',
  termo_curto: 'Digite pelo menos 2 letras.',
  sem_login: 'Sua sessão terminou. Entre de novo.',
  sem_internet: 'Sem internet. Conecte e tente de novo.',
};

export const mensagemPsn = (e: unknown) =>
  MENSAGENS[(e as Error).message] ?? 'Algo deu errado com a PSN. Tente de novo.';
