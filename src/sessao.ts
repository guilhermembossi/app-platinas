import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Sessão atual (null = ninguém entrou).
export function useSessao() {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'SIGNED_OUT') setSessao(null);
      else if (s) setSessao(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { carregando, sessao };
}
