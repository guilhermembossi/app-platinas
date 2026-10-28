// Tarefa 2.3: busca um jogo na conta PSN e adiciona (jogo, troféus e progresso).
// Rodar: node testes/teste_jogo.mjs  → pede e-mail e senha do Supabase, o nome do jogo e o número do resultado.
// Depois, conferir no PS5 o % e os troféus por tipo.
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

const email = await perguntar('E-mail (do Supabase): ');
const senha = await perguntar('Senha do Supabase (não aparece): ', true);

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

async function chamar(corpo) {
  const resp = await fetch(`${URL}/functions/v1/psn-jogos`, {
    method: 'POST',
    headers: { apikey: CHAVE_PUBLICAVEL, Authorization: `Bearer ${sessao.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  return { http: resp.status, dados: await resp.json() };
}

const termo = await perguntar('\nNome do jogo (ou parte dele): ');
const busca = await chamar({ acao: 'buscar', termo });
if (busca.dados.status !== 'ok') {
  console.log(`BUSCA FALHOU (HTTP ${busca.http}): ${busca.dados.status}`);
  process.exit(1);
}
if (busca.dados.jogos.length === 0) {
  console.log('Nenhum jogo da sua conta com esse nome.');
  process.exit(0);
}
console.log('');
busca.dados.jogos.forEach((j, i) => {
  console.log(`${i + 1}. ${j.nome} (${j.plataforma}) - ${j.progresso_pct}%${j.ja_adicionado ? ' [já adicionado]' : ''}`);
});

const n = Number(await perguntar('\nNúmero do jogo para adicionar: '));
const escolhido = busca.dados.jogos[n - 1];
if (!escolhido) {
  console.log('Número inválido.');
  process.exit(1);
}

console.log(`\nAdicionando ${escolhido.nome}...`);
const add = await chamar({ acao: 'adicionar', np_communication_id: escolhido.np_communication_id });
if (add.dados.status !== 'ok') {
  console.log(`ADICIONAR FALHOU (HTTP ${add.http}): ${add.dados.status}`);
  process.exit(1);
}
const j = add.dados.jogo;
console.log(`\nADICIONADO: ${j.nome} (${j.plataforma})`);
console.log(`Progresso: ${j.progresso_pct}%`);
console.log(`Troféus: ${j.conquistados} de ${j.trofeus}`);
for (const [tipo, c] of Object.entries(j.por_tipo)) console.log(`  ${tipo}: ${c.conquistados} de ${c.total}`);
console.log('\nConfira no PS5: o % e os troféus por tipo devem ser iguais.');
