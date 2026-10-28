// Tarefa 1.3: confere que o login por e-mail e senha funciona.
// Rodar: node testes/teste_login.mjs  → pede e-mail e senha (a senha não aparece na tela).
// Não guarda nem mostra a senha nem o token: só diz se entrou.
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

const resp = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: CHAVE_PUBLICAVEL, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: senha }),
});
const dados = await resp.json();

if (resp.ok && dados.access_token) {
  console.log(`\nLOGIN OK: entrou como ${dados.user.email}`);
} else {
  console.log(`\nLOGIN FALHOU (${resp.status}): ${dados.msg || dados.error_description || dados.error || 'erro desconhecido'}`);
}
