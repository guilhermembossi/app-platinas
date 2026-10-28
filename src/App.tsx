import type { Session } from '@supabase/supabase-js';
import { marca } from './config/marca';
import { useSessao } from './sessao';
import { supabase } from './supabase';
import Logo from './componentes/Logo';
import Acesso from './telas/Acesso';

export default function App() {
  const { carregando, sessao } = useSessao();
  if (carregando) return <div className="carregando" aria-busy="true"><Logo tamanho={64} /></div>;
  if (!sessao) return <Acesso />;
  return <Casca sessao={sessao} />;
}

// O app de quem já entrou. A lista de jogos entra na tarefa 3.2.
function Casca({ sessao }: { sessao: Session }) {
  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <Logo tamanho={28} />
          <span>{marca.nome}</span>
        </div>
      </header>

      <main className="conteudo">
        <p className="fraco">Entrou como {sessao.user.email}.</p>
        <button type="button" className="link" onClick={() => supabase.auth.signOut()}>Sair</button>
      </main>
    </div>
  );
}
