// Acesso à PSN pela psn-api (não oficial, versão fixada).
// Tokens só em memória e na tabela platinas.psn_auth: nunca em resposta, log ou mensagem de erro.
import {
  type AuthTokensResponse,
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
} from 'npm:psn-api@2.18.1';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';

// Com menos que isso para o refresh token vencer, entra de novo pelo NPSSO.
const MARGEM_MS = 24 * 60 * 60 * 1000;

// A PSN recusou o refresh token e o NPSSO: o Guilherme precisa gerar um NPSSO novo (tarefa 5.3).
export class PsnTokenExpirado extends Error {
  constructor() {
    super('token_expirado');
  }
}

// Devolve um access token válido e guarda o refresh token novo em psn_auth.
// `admin` é o cliente com service_role no schema platinas.
export async function obterAcessoPsn(
  admin: SupabaseClient,
  userId: string,
): Promise<{ accessToken: string; refreshExpiraEm: string }> {
  const { data: salvo, error } = await admin
    .from('psn_auth')
    .select('refresh_token, refresh_expira_em')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('falha ao ler psn_auth');

  let tokens: AuthTokensResponse | null = null;
  if (salvo && new Date(salvo.refresh_expira_em).getTime() - Date.now() > MARGEM_MS) {
    try {
      tokens = await exchangeRefreshTokenForAuthTokens(salvo.refresh_token);
    } catch {
      tokens = null; // refresh recusado: tenta o NPSSO
    }
  }
  if (!tokens) {
    const npsso = Deno.env.get('PSN_NPSSO');
    if (!npsso) throw new PsnTokenExpirado();
    try {
      const codigo = await exchangeNpssoForAccessCode(npsso);
      tokens = await exchangeAccessCodeForAuthTokens(codigo);
    } catch {
      throw new PsnTokenExpirado();
    }
  }

  const refreshExpiraEm = new Date(Date.now() + tokens.refreshTokenExpiresIn * 1000).toISOString();
  const { error: erroGravar } = await admin.from('psn_auth').upsert({
    user_id: userId,
    refresh_token: tokens.refreshToken,
    refresh_expira_em: refreshExpiraEm,
    atualizado_em: new Date().toISOString(),
  });
  if (erroGravar) throw new Error('falha ao gravar psn_auth');

  return { accessToken: tokens.accessToken, refreshExpiraEm };
}
