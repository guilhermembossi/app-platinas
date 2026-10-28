// Tarefa 2.2: entra com o usuário do Guilherme e chama a função psn-auth.
// Rodar: node testes/teste_psn_auth.mjs  → pede e-mail e senha (a senha não aparece na tela).
// Mostra só a resposta da função (estado e validade), que nunca traz tokens.
import readline from 'node:readline';

const URL = 'https://edrychcjsnnstfmndkhf.supabase.co';
const CHAVE_PUBLICAVEL = 'sb_publishable_JQkktT37DPN-itwjI5DzmQ_0-27422V';

function perguntar(texto, esconder = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (esconder) rl._writeToOutput = (s) => { if (s.startsWith(texto)) rl.output.write(texto); };
    rl.question(texto, (resposta) => { rl.close(); if (esconder) process.stdout.write('\n'); resolve(resposta.trim()); });
  });
}

const email = await perguntar('E-mail: ');
const senha = await perguntar('Senha (não aparece): ', true);

const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: CHAVE_PUBLICAVEL, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: senha }),
});
const sessao = await login.json();
if (!login.ok || !sessao.access_token) {
  console.log(`\nLOGIN FALHOU (${login.status}): ${sessao.msg || sessao.error_description || 'erro'}`);
  process.exit(1);
}

const resp = await fetch(`${URL}/functions/v1/psn-auth`, {
  method: 'POST',
  headers: { apikey: CHAVE_PUBLICAVEL, Authorization: `Bearer ${sessao.access_token}` },
});
const texto = await resp.text();
const chaves = (() => { try { return Object.keys(JSON.parse(texto)); } catch { return []; } })();
const soEstado = chaves.length > 0 && chaves.every((k) => k === 'status' || k === 'renovar_ate');

console.log(`\nFunção psn-auth (HTTP ${resp.status}): ${texto}`);
console.log(soEstado ? 'Resposta sem tokens: OK' : 'ATENÇÃO: resposta com campos inesperados');
