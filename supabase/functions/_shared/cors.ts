// O app chama as funções direto do navegador: só os endereços do app são aceitos.
const ORIGENS = ['https://guilhermembossi.github.io', 'http://127.0.0.1:4173', 'http://127.0.0.1:5173'];

export function cabecalhosCors(req: Request): Record<string, string> {
  const origem = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGENS.includes(origem) ? origem : ORIGENS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}
