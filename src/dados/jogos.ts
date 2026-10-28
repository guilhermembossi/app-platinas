import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type Jogo = {
  id: string;
  nome: string;
  plataforma: string | null;
  icone_url: string | null;
  progresso_pct: number;
  ultima_sync: string | null;
};

// Jogos adicionados (a RLS só devolve os do usuário logado), na ordem em que foram adicionados.
export function useJogos() {
  const [jogos, setJogos] = useState<Jogo[] | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setErro(false);
    const { data, error } = await supabase
      .from('games')
      .select('id, nome, plataforma, icone_url, progresso_pct, ultima_sync')
      .order('adicionado_em');
    if (error) setErro(true);
    else setJogos(data);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { jogos, erro, recarregar: carregar };
}

// "hoje às 21:19", "ontem às 08:05" ou "25/10 às 14:30" (horário do aparelho).
export function quando(iso: string, agora = new Date()): string {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((dia(agora) - dia(d)) / 86_400_000);
  if (dias === 0) return `hoje às ${hora}`;
  if (dias === 1) return `ontem às ${hora}`;
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`;
}
