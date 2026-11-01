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
  primaria: string;    // fundo dos botões principais (azul PS)
  sobrePrimaria: string; // texto em cima da cor primária
  destaque: string;    // azul claro para texto, links, barras e foco sobre o fundo escuro (contraste)
  sucesso: string;
  erro: string;        // mensagens de erro
  platina: string;     // cores dos tipos de troféu
  ouro: string;
  prata: string;
  bronze: string;
};

export const marca = {
  id: 'platinas', // prefixo das chaves guardadas no aparelho
  nome: 'Platinas',
  nomeCurto: 'Platinas',
  descricao: 'Suas platinas da PSN: troféus, progresso, missables e guia.',
  idioma: 'pt-BR',
  // Só tema escuro. Visual PlayStation (7.0 item 9): cores da arquitetura e da prévia aprovada,
  // sem logo nem símbolos da Sony.
  cores: {
    fundo: '#0a0f1a',
    superficie: '#161a21',
    texto: '#eef1f5',
    textoFraco: '#a3acb9',
    borda: '#2a303a',
    primaria: '#0070d1',
    sobrePrimaria: '#ffffff',
    destaque: '#3d9bff',
    sucesso: '#5fcb8a',
    erro: '#f0a04b',
    platina: '#9fc3e6',
    ouro: '#e2b04a',
    prata: '#b8c0cc',
    bronze: '#c9835a',
  } satisfies Paleta,
  icone: { fundo: '#0070d1', desenho: '#ffffff' },
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
