import { createClient, type AuthError } from '@supabase/supabase-js';
import { ESQUEMA, SUPABASE_CHAVE_PUBLICAVEL, SUPABASE_URL } from './config/supabase';

// Sessão guardada no aparelho (localStorage) e renovada sozinha.
export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICAVEL, {
  auth: { persistSession: true, autoRefreshToken: true },
  db: { schema: ESQUEMA },
});

const MENSAGENS: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Esse e-mail ainda não foi confirmado.',
  email_address_invalid: 'E-mail inválido.',
  over_request_rate_limit: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  validation_failed: 'Confira os dados digitados.',
};

export function mensagemDeErro(erro: AuthError | Error): string {
  const codigo = 'code' in erro ? erro.code : undefined;
  if (codigo && MENSAGENS[codigo]) return MENSAGENS[codigo];
  if (!navigator.onLine) return 'Sem internet. Conecte e tente de novo.';
  return 'Algo deu errado. Tente de novo.';
}
