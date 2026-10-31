import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type TipoTrofeu = 'platina' | 'ouro' | 'prata' | 'bronze';

export type Trofeu = {
  id: string;
  trophy_id: number;
  grupo_id: string;
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
  grupos: Grupo[];
  platinado: boolean;
};

// Bloco de troféus da PSN (7.0 item 1): 'default' = jogo base; '001', '002'... = DLCs.
export type Grupo = { id: string; nome: string };
export const GRUPO_BASE = 'default';

export type Filtro = 'todos' | 'faltando' | 'missables';

// Junta os troféus por bloco, na ordem da PSN. Blocos sem troféu nenhum (depois do filtro) somem.
export function porBloco(trofeus: Trofeu[], grupos: Grupo[]): { grupo: Grupo; trofeus: Trofeu[] }[] {
  const ordem = grupos.length > 0 ? grupos : [{ id: GRUPO_BASE, nome: '' }];
  return ordem
    .map((grupo) => ({ grupo, trofeus: trofeus.filter((t) => t.grupo_id === grupo.id) }))
    .filter((b) => b.trofeus.length > 0);
}

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
        .select('id, nome, plataforma, icone_url, progresso_pct, guia_url, ultima_sync, grupos, platinado')
        .eq('id', id).maybeSingle(),
      supabase.from('trophies')
        .select('id, trophy_id, grupo_id, nome, descricao, tipo, icone_url, oculto, conquistado, conquistado_em, is_missable')
        .eq('game_id', id).order('trophy_id'),
    ]).then(([g, t]) => {
      if (!ativo) return;
      if (g.error || t.error) { setErro(true); return; }
      setJogo(g.data ?? 'nao_encontrado');
      setTrofeus(t.data as Trofeu[]);
    });
    return () => { ativo = false; };
  }, [id, tentativa]);

  // Marca/desmarca missable à mão (tarefa 4.4). Muda na tela na hora e volta atrás se o banco recusar.
  // Origem "manual" nos dois casos: a sincronização nunca mexe nesses campos.
  async function alterarMissable(trofeuId: string, valor: boolean): Promise<boolean> {
    const trocar = (v: boolean) =>
      setTrofeus((ts) => ts.map((t) => (t.id === trofeuId ? { ...t, is_missable: v } : t)));
    trocar(valor);
    const { error } = await supabase
      .from('trophies')
      .update({ is_missable: valor, missable_origem: 'manual' })
      .eq('id', trofeuId);
    if (error) trocar(!valor);
    return !error;
  }

  return { jogo, trofeus, erro, recarregar: () => setTentativa((n) => n + 1), alterarMissable };
}
