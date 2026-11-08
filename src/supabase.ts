import { createClient, type AuthError } from '@supabase/supabase-js';
import { ESQUEMA, SUPABASE_CHAVE_PUBLICAVEL, SUPABASE_URL } from './config/supabase';
import type { Textos } from './i18n';

// Sessão guardada no aparelho (localStorage) e renovada sozinha.
export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICAVEL, {
  auth: { persistSession: true, autoRefreshToken: true },
  db: { schema: ESQUEMA },
});

// Mensagem de erro do login no idioma do app (7.1.1).
export function mensagemDeErro(erro: AuthError | Error, t: Textos): string {
  const codigo = 'code' in erro ? erro.code : undefined;
  if (codigo && t.errosLogin[codigo]) return t.errosLogin[codigo];
  if (!navigator.onLine) return t.semInternet;
  return t.algoErrado;
}
