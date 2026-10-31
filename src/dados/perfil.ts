import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

// Perfil PSN da aba Resumo (7.0 item 3): números da conta PSN inteira, gravados pela sincronização.
export type Perfil = {
  online_id: string;
  avatar_url: string | null;
  nivel: number;
  nivel_progresso: number;
  platinas: number;
  completos: number;
  ouro: number;
  prata: number;
  bronze: number;
  atualizado_em: string;
};

// null = carregando; 'vazio' = ainda não sincronizou depois que o Resumo existe.
export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null | 'vazio'>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setErro(false);
    const { data, error } = await supabase
      .from('psn_profile')
      .select('online_id, avatar_url, nivel, nivel_progresso, platinas, completos, ouro, prata, bronze, atualizado_em')
      .maybeSingle();
    if (error) setErro(true);
    else setPerfil(data ?? 'vazio');
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { perfil, erro, recarregar: carregar };
}
