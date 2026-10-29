import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type TipoTrofeu = 'platina' | 'ouro' | 'prata' | 'bronze';

export type Trofeu = {
  id: string;
  trophy_id: number;
  nome: string;
  descricao: string | null;
  tipo: TipoTrofeu;
  icone_url: string | null;
  oculto: boolean;
  conquistado: boolean;
  conquistado_em: string | null;
  is_missable: boolean;
};

export type DetalheJogo = {
  id: string;
  nome: string;
  plataforma: string | null;
  icone_url: string | null;
  progresso_pct: number;
  guia_url: string | null;
  ultima_sync: string | null;
};

export type Filtro = 'todos' | 'faltando' | 'missables';

export function filtrar(trofeus: Trofeu[], filtro: Filtro): Trofeu[] {
  if (filtro === 'faltando') return trofeus.filter((t) => !t.conquistado);
  if (filtro === 'missables') return trofeus.filter((t) => t.is_missable);
  return trofeus;
}

// Jogo e troféus (na ordem da PSN). null = carregando; "nao_encontrado" = id que não é do usuário.
export function useJogo(id: string) {
  const [jogo, setJogo] = useState<DetalheJogo | null | 'nao_encontrado'>(null);
  const [trofeus, setTrofeus] = useState<Trofeu[]>([]);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setErro(false);
    Promise.all([
      supabase.from('games')
        .select('id, nome, plataforma, icone_url, progresso_pct, guia_url, ultima_sync')
        .eq('id', id).maybeSingle(),
      supabase.from('trophies')
        .select('id, trophy_id, nome, descricao, tipo, icone_url, oculto, conquistado, conquistado_em, is_missable')
        .eq('game_id', id).order('trophy_id'),
    ]).then(([g, t]) => {
      if (!ativo) return;
      if (g.error || t.error) { setErro(true); return; }
      setJogo(g.data ?? 'nao_encontrado');
      setTrofeus(t.data as Trofeu[]);
    });
    return () => { ativo = false; };
  }, [id, tentativa]);

  return { jogo, trofeus, erro, recarregar: () => setTentativa((n) => n + 1) };
}
