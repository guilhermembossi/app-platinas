// Marca do app: nome, cores e logo ficam SÓ aqui.
// Daqui saem o título da página, o manifest do app instalável, as cores do tema e os ícones
// (depois de mudar o logo ou a cor do ícone: `npm run icones`).
// Só sintaxe que o Node lê direto (sem enum/namespace): o script dos ícones importa este arquivo.

export type Paleta = {
  fundo: string;       // fundo da tela
  superficie: string;  // cartões e topo
  texto: string;
  textoFraco: string;  // textos secundários
  borda: string;
  primaria: string;    // botões principais
  sobrePrimaria: string; // texto em cima da cor primária
  sucesso: string;
  erro: string;        // mensagens de erro
};

export const marca = {
  id: 'platinas', // prefixo das chaves guardadas no aparelho
  nome: 'Platinas',
  nomeCurto: 'Platinas',
  descricao: 'Suas platinas da PSN: troféus, progresso, missables e guia.',
  idioma: 'pt-BR',
  // Só tema escuro (decisão da arquitetura).
  cores: {
    fundo: '#0b0e14',
    superficie: '#151a24',
    texto: '#e8ecf4',
    textoFraco: '#94a0b4',
    borda: '#252c3a',
    primaria: '#8ab4ff',
    sobrePrimaria: '#0b1324',
    sucesso: '#4ade80',
    erro: '#fb923c',
  } satisfies Paleta,
  icone: { fundo: '#1e2a44', desenho: '#cfdcff' },
};

// Logo: troféu. `cantos` = false para os ícones que o próprio sistema arredonda (iPhone, maskable).
export function logoSvg(fundo: string, desenho: string, cantos = true): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">`
    + `<rect width="512" height="512" rx="${cantos ? 112 : 0}" fill="${fundo}"/>`
    + `<g fill="none" stroke="${desenho}" stroke-width="22" stroke-linecap="round">`
    + `<path d="M176 156h-36v20c0 34 22 60 52 64"/>`
    + `<path d="M336 156h36v20c0 34-22 60-52 64"/>`
    + `</g>`
    + `<g fill="${desenho}">`
    + `<path d="M168 120h176v84c0 58-39 104-88 104s-88-46-88-104z"/>`
    + `<rect x="238" y="300" width="36" height="52"/>`
    + `<rect x="184" y="348" width="144" height="40" rx="10"/>`
    + `</g></svg>`;
}
