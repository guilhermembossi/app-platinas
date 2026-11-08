import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

// Idioma do app (tarefa 7.1.1): português (padrão) ou inglês, no modelo da PSN em inglês.
// A escolha fica no banco (platinas.preferencias) e vale até trocar de novo. O aparelho guarda uma
// cópia só para abrir já no idioma certo, sem piscar em português; quem manda é o banco.
export type Idioma = 'pt' | 'en';

const CHAVE_LOCAL = 'platinas.idioma';

function idiomaGuardado(): Idioma {
  try {
    return localStorage.getItem(CHAVE_LOCAL) === 'en' ? 'en' : 'pt';
  } catch {
    return 'pt';
  }
}

function guardar(idioma: Idioma) {
  try {
    localStorage.setItem(CHAVE_LOCAL, idioma);
  } catch { /* sem armazenamento no aparelho: o banco continua valendo */ }
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

const pt = {
  local: 'pt-BR',
  // Geral
  carregando: 'Carregando…',
  tentarDeNovo: 'Tentar de novo',
  meusJogos: 'Meus jogos',
  resumo: 'Resumo',
  navegacao: 'Navegação principal',
  voltar: 'Voltar',
  voltarMeusJogos: 'Voltar para Meus jogos',
  sair: 'Sair',
  hoje: (hora: string) => `hoje às ${hora}`,
  ontem: (hora: string) => `ontem às ${hora}`,
  noDia: (dia: string, hora: string) => `${dia} às ${hora}`,
  sincronizado: (quando: string) => `sincronizado ${quando}`,
  // Tipos de troféu e raridade (faixas da PSN)
  tipos: { platina: 'Platina', ouro: 'Ouro', prata: 'Prata', bronze: 'Bronze' },
  raridades: { 'ultra-raro': 'Ultra raro', 'muito-raro': 'Muito raro', raro: 'Raro', comum: 'Comum' },
  // Entrar
  entrar: 'Entrar',
  email: 'E-mail',
  senha: 'Senha',
  aguarde: 'Aguarde…',
  errosLogin: {
    invalid_credentials: 'E-mail ou senha incorretos.',
    email_not_confirmed: 'Esse e-mail ainda não foi confirmado.',
    email_address_invalid: 'E-mail inválido.',
    over_request_rate_limit: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
    validation_failed: 'Confira os dados digitados.',
  } as Record<string, string>,
  semInternet: 'Sem internet. Conecte e tente de novo.',
  algoErrado: 'Algo deu errado. Tente de novo.',
  // Meus jogos
  adicionarJogo: '+ Adicionar jogo',
  erroJogos: 'Não deu para carregar seus jogos.',
  nenhumJogo: 'Nenhum jogo ainda.',
  dicaNenhumJogo: 'Toque em "Adicionar jogo" e escolha um jogo da sua conta PSN.',
  erroFixar: 'Não deu para fixar o jogo. Tente de novo.',
  fixar: (nome: string) => `Fixar ${nome} no topo`,
  desafixar: (nome: string) => `Desafixar ${nome}`,
  seloPlatina: '✓ Platina',
  progressoDe: (nome: string) => `Progresso de ${nome}`,
  trofeusDe: (feitos: number, total: number) => `${feitos} de ${total} troféus`,
  // Sincronizar
  sincronizando: 'Sincronizando…',
  sincronizarJogo: 'Sincronizar este jogo',
  sincronizarTodos: 'Sincronizar todos os jogos',
  naoSincronizou: (n: number) => `${plural(n, 'jogo', 'jogos')} não ${n === 1 ? 'sincronizou' : 'sincronizaram'}. Tente de novo.`,
  errosPsn: {
    token_expirado: 'O acesso à PSN venceu. O passo a passo para renovar está na tela inicial.',
    nao_encontrado: 'Esse jogo não está mais na sua conta PSN.',
    termo_curto: 'Digite pelo menos 2 letras.',
    sem_login: 'Sua sessão terminou. Entre de novo.',
    sem_internet: 'Sem internet. Conecte e tente de novo.',
  } as Record<string, string>,
  erroPsn: 'Algo deu errado com a PSN. Tente de novo.',
  // Aviso de token vencido
  token: {
    titulo: 'O acesso à PSN venceu',
    intro: 'Os jogos não estão sincronizando. Gere um código novo (NPSSO) no computador:',
    passo1: ['Entre em ', ' com a sua conta.'],
    passo2: ['Na mesma janela, abra ', '.'],
    passo3: ['Copie só o código entre aspas depois de ', ' (64 letras e números).'],
    passo4: ['No Supabase, projeto ', ': Edge Functions → Secrets → ', ' → editar, colar o código e salvar.'],
    passo5: 'Não clique em "Sair" no site da PlayStation (isso invalida o código).',
    passo6: ['Volte aqui e toque em ', '↻ Sincronizar', '. O aviso some quando der certo.'],
    cuidado: 'Nunca cole esse código em chat, e-mail ou arquivo: ele vale como a senha da sua conta.',
  },
  // Tela do jogo
  filtros: { todos: 'Todos', faltando: 'Faltando', missables: 'Missables' },
  filtrarTrofeus: 'Filtrar troféus',
  vazio: {
    todos: 'Esse jogo não tem troféus.',
    faltando: 'Nenhum troféu faltando: 100%!',
    missables: 'Nenhum troféu marcado como missable.',
  },
  jogoBase: 'Jogo base',
  erroJogo: 'Não deu para carregar esse jogo.',
  jogoNaoEncontrado: 'Jogo não encontrado.',
  progresso: 'Progresso',
  semPlatina: 'esse jogo não tem',
  platinaFeita: '✓ conquistada',
  platinaBase: (feitos: number, total: number) => `jogo base: ${feitos} de ${total}`,
  completo: '✓ completo',
  trofeus100: (feitos: number, total: number, dlc: boolean) => `${feitos} de ${total} troféus${dlc ? ', com DLCs' : ''}`,
  abrirGuia: 'Abrir guia',
  procurarGuia: 'Procurar guia',
  semGuia: 'Esse jogo não tem guia na PowerPyx. A busca abre no navegador.',
  erroMissable: 'Não deu para salvar o missable. Tente de novo.',
  conquistado: 'Conquistado',
  faltando: 'Faltando',
  oculto: 'Oculto',
  deTotal: (feitos: number, total: number) => `${feitos} de ${total}`,
  marcarMissable: (nome: string) => `Marcar ${nome} como missable`,
  desmarcarMissable: (nome: string) => `Desmarcar ${nome} como missable`,
  // Resumo
  erroResumo: 'Não deu para carregar o resumo.',
  semPerfil: 'Ainda sem dados do perfil.',
  dicaSemPerfil: 'Toque em "↻ Sincronizar" para buscar na PSN.',
  perfilPsn: 'Perfil PSN',
  nivel: (n: number) => `Nível ${n}`,
  progressoNivel: (n: number) => `Progresso até o nível ${n}`,
  paraNivel: (pct: number, n: number) => `${pct}% para o nível ${n}`,
  platinas: 'Platinas',
  jogos100: 'Jogos com 100%',
  trofeusPorTipo: 'Troféus por tipo',
  trofeusConquistados: 'Troféus conquistados',
  contaInteira: (quando: string) => `Números da sua conta PSN inteira · atualizado ${quando}`,
  idioma: 'Idioma',
  dicaIdioma: 'Troféus, blocos e telas no idioma escolhido.',
  erroIdioma: 'Não deu para salvar o idioma. Tente de novo.',
  // Adicionar
  tituloAdicionar: 'Adicionar jogo',
  nomeDoJogo: 'Nome do jogo',
  buscar: 'Buscar',
  buscando: 'Buscando…',
  dicaBusca: 'Só aparecem jogos que você já abriu no console (os que têm troféus na sua conta).',
  nenhumResultado: 'Nenhum jogo da sua conta com esse nome.',
  jaAdicionado: 'Já adicionado',
  adicionar: 'Adicionar',
  importando: 'Importando troféus e progresso…',
  importados: (n: number) => `Troféus e progresso importados (${n})`,
  guia: 'Guia',
  procurandoGuia: 'Procurando o guia na PowerPyx…',
  guiaAchado: 'Guia encontrado na PowerPyx',
  guiaErro: 'Não deu para procurar o guia agora',
  guiaNenhum: 'Sem guia na PowerPyx (a busca fica na tela do jogo)',
  pronto: 'Pronto',
  abrirJogo: 'Abrir o jogo',
};

export type Textos = typeof pt;

// Inglês nos termos da PSN em inglês (Platinum, Ultra Rare...).
const en: Textos = {
  local: 'en-US',
  carregando: 'Loading…',
  tentarDeNovo: 'Try again',
  meusJogos: 'My Games',
  resumo: 'Summary',
  navegacao: 'Main navigation',
  voltar: 'Back',
  voltarMeusJogos: 'Back to My Games',
  sair: 'Sign out',
  hoje: (hora) => `today at ${hora}`,
  ontem: (hora) => `yesterday at ${hora}`,
  noDia: (dia, hora) => `${dia} at ${hora}`,
  sincronizado: (quando) => `synced ${quando}`,
  tipos: { platina: 'Platinum', ouro: 'Gold', prata: 'Silver', bronze: 'Bronze' },
  raridades: { 'ultra-raro': 'Ultra Rare', 'muito-raro': 'Very Rare', raro: 'Rare', comum: 'Common' },
  entrar: 'Sign in',
  email: 'Email',
  senha: 'Password',
  aguarde: 'Please wait…',
  errosLogin: {
    invalid_credentials: 'Wrong email or password.',
    email_not_confirmed: 'This email has not been confirmed yet.',
    email_address_invalid: 'Invalid email.',
    over_request_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
    validation_failed: 'Check what you typed.',
  },
  semInternet: 'No internet connection. Connect and try again.',
  algoErrado: 'Something went wrong. Try again.',
  adicionarJogo: '+ Add game',
  erroJogos: "Couldn't load your games.",
  nenhumJogo: 'No games yet.',
  dicaNenhumJogo: 'Tap "Add game" and pick a game from your PSN account.',
  erroFixar: "Couldn't pin the game. Try again.",
  fixar: (nome) => `Pin ${nome} to the top`,
  desafixar: (nome) => `Unpin ${nome}`,
  seloPlatina: '✓ Platinum',
  progressoDe: (nome) => `${nome} progress`,
  trofeusDe: (feitos, total) => `${feitos} of ${total} trophies`,
  sincronizando: 'Syncing…',
  sincronizarJogo: 'Sync this game',
  sincronizarTodos: 'Sync all games',
  naoSincronizou: (n) => `${plural(n, 'game', 'games')} didn't sync. Try again.`,
  errosPsn: {
    token_expirado: 'PSN access has expired. The steps to renew it are on the home screen.',
    nao_encontrado: 'This game is no longer in your PSN account.',
    termo_curto: 'Type at least 2 letters.',
    sem_login: 'Your session has ended. Sign in again.',
    sem_internet: 'No internet connection. Connect and try again.',
  },
  erroPsn: 'Something went wrong with PSN. Try again.',
  token: {
    titulo: 'PSN access has expired',
    intro: 'Your games are not syncing. Get a new code (NPSSO) on the computer:',
    passo1: ['Sign in at ', ' with your account.'],
    passo2: ['In the same window, open ', '.'],
    passo3: ['Copy only the code in quotes after ', ' (64 letters and numbers).'],
    passo4: ['In Supabase, project ', ': Edge Functions → Secrets → ', ' → edit, paste the code and save.'],
    passo5: 'Do not click "Sign out" on the PlayStation site (that invalidates the code).',
    passo6: ['Come back here and tap ', '↻ Sync', '. The warning goes away when it works.'],
    cuidado: 'Never paste this code in a chat, email or file: it works like your account password.',
  },
  filtros: { todos: 'All', faltando: 'Not Earned', missables: 'Missables' },
  filtrarTrofeus: 'Filter trophies',
  vazio: {
    todos: 'This game has no trophies.',
    faltando: 'No trophies left: 100%!',
    missables: 'No trophies marked as missable.',
  },
  jogoBase: 'Base Game',
  erroJogo: "Couldn't load this game.",
  jogoNaoEncontrado: 'Game not found.',
  progresso: 'Progress',
  semPlatina: 'this game has none',
  platinaFeita: '✓ earned',
  platinaBase: (feitos, total) => `base game: ${feitos} of ${total}`,
  completo: '✓ complete',
  trofeus100: (feitos, total, dlc) => `${feitos} of ${total} trophies${dlc ? ', incl. DLC' : ''}`,
  abrirGuia: 'Open guide',
  procurarGuia: 'Search for guide',
  semGuia: 'No PowerPyx guide for this game. The search opens in the browser.',
  erroMissable: "Couldn't save the missable. Try again.",
  conquistado: 'Earned',
  faltando: 'Not Earned',
  oculto: 'Hidden',
  deTotal: (feitos, total) => `${feitos} of ${total}`,
  marcarMissable: (nome) => `Mark ${nome} as missable`,
  desmarcarMissable: (nome) => `Unmark ${nome} as missable`,
  erroResumo: "Couldn't load the summary.",
  semPerfil: 'No profile data yet.',
  dicaSemPerfil: 'Tap "↻ Sync" to get it from PSN.',
  perfilPsn: 'PSN profile',
  nivel: (n) => `Level ${n}`,
  progressoNivel: (n) => `Progress to level ${n}`,
  paraNivel: (pct, n) => `${pct}% to level ${n}`,
  platinas: 'Platinums',
  jogos100: '100% Games',
  trofeusPorTipo: 'Trophies by grade',
  trofeusConquistados: 'Trophies earned',
  contaInteira: (quando) => `Numbers from your whole PSN account · updated ${quando}`,
  idioma: 'Language',
  dicaIdioma: 'Trophies, groups and screens in the chosen language.',
  erroIdioma: "Couldn't save the language. Try again.",
  tituloAdicionar: 'Add game',
  nomeDoJogo: 'Game name',
  buscar: 'Search',
  buscando: 'Searching…',
  dicaBusca: 'Only games you have already started on the console show up (the ones with trophies on your account).',
  nenhumResultado: 'No game in your account with that name.',
  jaAdicionado: 'Already added',
  adicionar: 'Add',
  importando: 'Importing trophies and progress…',
  importados: (n) => `Trophies and progress imported (${n})`,
  guia: 'Guide',
  procurandoGuia: 'Looking for the guide on PowerPyx…',
  guiaAchado: 'Guide found on PowerPyx',
  guiaErro: "Couldn't look for the guide right now",
  guiaNenhum: 'No guide on PowerPyx (the search is on the game screen)',
  pronto: 'Done',
  abrirJogo: 'Open the game',
};

const TEXTOS: Record<Idioma, Textos> = { pt, en };

type Contexto = { idioma: Idioma; t: Textos; trocar: (novo: Idioma) => Promise<boolean> };

const IdiomaContexto = createContext<Contexto>({ idioma: 'pt', t: pt, trocar: async () => false });

// `userId` = quem entrou (null na tela de entrar): o idioma salvo dele vem do banco.
export function IdiomaProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaGuardado);

  useEffect(() => { document.documentElement.lang = TEXTOS[idioma].local; }, [idioma]);

  useEffect(() => {
    if (!userId) return;
    let ativo = true;
    supabase.from('preferencias').select('idioma').maybeSingle().then(({ data, error }) => {
      if (!ativo || error) return;
      const salvo: Idioma = data?.idioma === 'en' ? 'en' : 'pt'; // sem linha = padrão (português)
      setIdioma(salvo);
      guardar(salvo);
    });
    return () => { ativo = false; };
  }, [userId]);

  // Muda na tela na hora e volta atrás se o banco recusar.
  const trocar = useCallback(async (novo: Idioma) => {
    if (!userId) return false;
    const anterior = idioma;
    setIdioma(novo);
    guardar(novo);
    const { error } = await supabase.from('preferencias')
      .upsert({ user_id: userId, idioma: novo, atualizado_em: new Date().toISOString() });
    if (error) {
      setIdioma(anterior);
      guardar(anterior);
    }
    return !error;
  }, [userId, idioma]);

  return <IdiomaContexto.Provider value={{ idioma, t: TEXTOS[idioma], trocar }}>{children}</IdiomaContexto.Provider>;
}

export const useIdioma = () => useContext(IdiomaContexto);

// "hoje às 21:19" / "today at 9:19 PM", "ontem às…", "25/10 às 14:30" / "Oct 25 at 2:30 PM" (horário do aparelho).
export function quando(iso: string, t: Textos, agora = new Date()): string {
  const d = new Date(iso);
  // "21:19" em português; "9:19 PM" em inglês (sem o zero na frente, como a PSN).
  const hora = d.toLocaleTimeString(t.local, { hour: t.local === 'pt-BR' ? '2-digit' : 'numeric', minute: '2-digit' });
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((dia(agora) - dia(d)) / 86_400_000);
  if (dias === 0) return t.hoje(hora);
  if (dias === 1) return t.ontem(hora);
  const data = t.local === 'pt-BR'
    ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return t.noDia(data, hora);
}

// Data em que conquistou: "08/11/2026" / "Nov 8, 2026".
export function dataCompleta(iso: string, t: Textos): string {
  const d = new Date(iso);
  return t.local === 'pt-BR'
    ? d.toLocaleDateString('pt-BR')
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
