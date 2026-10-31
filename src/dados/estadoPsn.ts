import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

// Tarefa 5.3: o acesso à PSN venceu? Vale o último registro em sync_log (sync diária ou botão).
// A RLS só devolve as linhas do usuário logado.
export function useTokenVencido() {
  const [vencido, setVencido] = useState(false);

  const conferir = useCallback(async () => {
    const { data } = await supabase
      .from('sync_log')
      .select('status')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    setVencido(data?.status === 'token_expirado');
  }, []);

  useEffect(() => { conferir(); }, [conferir]);

  return { vencido, conferir };
}
