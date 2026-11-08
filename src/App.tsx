import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { marca } from './config/marca';
import { useSessao } from './sessao';
import { IdiomaProvider, useIdioma } from './i18n';
import Logo from './componentes/Logo';
import Acesso from './telas/Acesso';
import Inicio, { ROTA_ADICIONAR } from './telas/Inicio';
import Adicionar from './telas/Adicionar';
import Jogo, { ROTA_JOGO } from './telas/Jogo';
import Resumo, { ROTA_RESUMO } from './telas/Resumo';

export default function App() {
  const { carregando, sessao } = useSessao();
  // Idioma do app (7.1.1): vale em todas as telas, inclusive a de entrar.
  return (
    <IdiomaProvider userId={sessao?.user.id ?? null}>
      {carregando ? <div className="carregando" aria-busy="true"><Logo tamanho={64} /></div>
        : !sessao ? <Acesso />
          : <Casca sessao={sessao} />}
    </IdiomaProvider>
  );
}

// O app de quem já entrou. Navegação pelo # do endereço (funciona no GitHub Pages e o voltar do celular volta de tela).
function Casca({ sessao }: { sessao: Session }) {
  const { t } = useIdioma();
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
          : hash === ROTA_RESUMO ? <Resumo />
            : hash.startsWith(ROTA_JOGO) ? <Jogo key={hash} id={hash.slice(ROTA_JOGO.length)} />
              : <Inicio sessao={sessao} />}
      </main>

      {/* Abas (7.0 item 3): Resumo só na própria aba; jogo e adicionar contam como "Meus jogos". */}
      <nav className="abas" aria-label={t.navegacao}>
        <a className="aba" href="#/" aria-current={hash !== ROTA_RESUMO ? 'page' : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          <span>{t.meusJogos}</span>
        </a>
        <a className="aba" href={ROTA_RESUMO} aria-current={hash === ROTA_RESUMO ? 'page' : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
          </svg>
          <span>{t.resumo}</span>
        </a>
      </nav>
    </div>
  );
}
