// Tarefa 4.1: acha o link do guia de troféus de um jogo na PowerPyx, pelo endereço padrão
// (formato fixo, sempre lista os missables).
// Só a PowerPyx: PSNProfiles e PlayStationTrophies bloqueiam acesso automático (403) e o buscador
// da web bloqueia pedidos vindos do servidor. Sem guia aqui, o app mostra "Procurar guia",
// que abre a busca no navegador do Guilherme (decisão de 31/10/2026).
// Nunca quebra quem chama: sem guia (ou site fora do ar) devolve null.

export type Guia = { url: string; fonte: 'powerpyx' };

const CABECALHOS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function baixar(url: string): Promise<Response | null> {
  try {
    return await fetch(url, { headers: CABECALHOS, redirect: 'follow', signal: AbortSignal.timeout(10_000) });
  } catch {
    return null;
  }
}

// "Marvel's Spider-Man 2®" → "marvels-spider-man-2" (o formato dos endereços da PowerPyx).
export function slug(nome: string): string {
  return nome
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Guias novos terminam em "-trophy-guide-roadmap/"; os antigos em "-trophy-guide/" (e redirecionam).
export async function acharGuia(nome: string): Promise<Guia | null> {
  const s = slug(nome);
  if (!s) return null;
  for (const sufixo of ['-trophy-guide-roadmap/', '-trophy-guide/']) {
    const resp = await baixar(`https://www.powerpyx.com/${s}${sufixo}`);
    if (!resp?.ok || !new URL(resp.url).hostname.endsWith('powerpyx.com')) continue;
    const html = await resp.text();
    if (/trophy guide/i.test(html)) return { url: resp.url, fonte: 'powerpyx' };
  }
  return null;
}
