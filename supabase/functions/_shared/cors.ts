// O app chama as funções direto do navegador: só os endereços do app são aceitos.
const ORIGENS = ['https://guilhermembossi.github.io', 'http://127.0.0.1:4173', 'http://127.0.0.1:5173'];
// O PC servindo o app na rede de casa, para testar no iPhone (tarefa 3.4).
const REDE_DE_CASA = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):(4173|5173)$/;

export function cabecalhosCors(req: Request): Record<string, string> {
  const origem = req.headers.get('Origin') ?? '';
  const aceita = ORIGENS.includes(origem) || REDE_DE_CASA.test(origem);
  return {
    'Access-Control-Allow-Origin': aceita ? origem : ORIGENS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}
