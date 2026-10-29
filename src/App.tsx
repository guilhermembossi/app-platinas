import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { marca } from './config/marca';
import { useSessao } from './sessao';
import Logo from './componentes/Logo';
import Acesso from './telas/Acesso';
import Inicio, { ROTA_ADICIONAR } from './telas/Inicio';
import Adicionar from './telas/Adicionar';
import Jogo, { ROTA_JOGO } from './telas/Jogo';

export default function App() {
  const { carregando, sessao } = useSessao();
  if (carregando) return <div className="carregando" aria-busy="true"><Logo tamanho={64} /></div>;
  if (!sessao) return <Acesso />;
  return <Casca sessao={sessao} />;
}

// O app de quem já entrou. Navegação pelo # do endereço (funciona no GitHub Pages e o voltar do celular volta de tela).
function Casca({ sessao }: { sessao: Session }) {
  const [hash, setHash] = useState(location.hash);

  useEffect(() => {
    const aoMudar = () => { setHash(location.hash); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  return (
    <div className="app">
      <header className="topo">
        <a className="marca" href="#/">
          <Logo tamanho={28} />
          <span>{marca.nome}</span>
        </a>
      </header>

      <main className="conteudo">
        {hash === ROTA_ADICIONAR ? <Adicionar />
          : hash.startsWith(ROTA_JOGO) ? <Jogo key={hash} id={hash.slice(ROTA_JOGO.length)} />
            : <Inicio sessao={sessao} />}
      </main>
    </div>
  );
}
