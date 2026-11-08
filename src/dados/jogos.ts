import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type Jogo = {
  id: string;
  nome: string;
  plataforma: string | null;
  icone_url: string | null;
  progresso_pct: number;
  ultima_sync: string | null;
  platinado: boolean;
  fixado: boolean;
  trofeus_total: number;
  trofeus_conquistados: number;
};

// "PS5,PSPC" (jogo com versão de PC na mesma lista de troféus) → "PS5 / PC".
export const plataformaLegivel = (p: string | null) => (p ?? '').split(',').map((x) => (x === 'PSPC' ? 'PC' : x)).join(' / ');

// Ordem de "Meus jogos" (7.0 item 2): fixados primeiro, depois o resto; cada parte em ordem
// alfabética, sem diferença de maiúscula ou acento ("Ōkami" junto de "Okami").
export function ordenar(jogos: Jogo[]): Jogo[] {
  return [...jogos].sort((a, b) =>
    Number(b.fixado) - Number(a.fixado) || a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

// Jogos adicionados (a RLS só devolve os do usuário logado), já na ordem da tela.
export function useJogos() {
  const [jogos, setJogos] = useState<Jogo[] | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setErro(false);
    const { data, error } = await supabase
      .from('games')
      .select('id, nome, plataforma, icone_url, progresso_pct, ultima_sync, platinado, fixado, trofeus_total, trofeus_conquistados');
    if (error) setErro(true);
    else setJogos(ordenar(data));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Estrela (7.0 item 2): muda na tela na hora e volta atrás se o banco recusar. A sync não mexe nisso.
  async function alterarFixado(jogoId: string, valor: boolean): Promise<boolean> {
    const trocar = (v: boolean) =>
      setJogos((js) => js && ordenar(js.map((j) => (j.id === jogoId ? { ...j, fixado: v } : j))));
    trocar(valor);
    const { error } = await supabase.from('games').update({ fixado: valor }).eq('id', jogoId);
    if (error) trocar(!valor);
    return !error;
  }

  return { jogos, erro, recarregar: carregar, alterarFixado };
}
