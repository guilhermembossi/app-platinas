import type { Session } from '@supabase/supabase-js';
import { quando, useJogos, type Jogo } from '../dados/jogos';
import { supabase } from '../supabase';
import { ROTA_JOGO } from './Jogo';

export const ROTA_ADICIONAR = '#/adicionar';

// Tela inicial: os jogos adicionados com ícone, % e barra, e a última sincronização de cada um.
export default function Inicio({ sessao }: { sessao: Session }) {
  const { jogos, erro, recarregar } = useJogos();

  return (
    <>
      <div className="cabecalho">
        <h1>Meus jogos</h1>
        <a className="botao-primario botao-pequeno" href={ROTA_ADICIONAR}>+ Adicionar jogo</a>
      </div>

      {erro ? (
        <div className="cartao vazio">
          <p>Não deu para carregar seus jogos.</p>
          <button type="button" className="link" onClick={recarregar}>Tentar de novo</button>
        </div>
      ) : jogos === null ? (
        <p className="fraco" aria-busy="true">Carregando…</p>
      ) : jogos.length === 0 ? (
        <div className="cartao vazio">
          <p>Nenhum jogo ainda.</p>
          <p className="fraco">Toque em "Adicionar jogo" e escolha um jogo da sua conta PSN.</p>
        </div>
      ) : (
        <ul className="lista-jogos">
          {jogos.map((j) => <CartaoJogo key={j.id} jogo={j} />)}
        </ul>
      )}

      <footer className="rodape">
        <span className="fraco">{sessao.user.email}</span>
        <button type="button" className="link" onClick={() => supabase.auth.signOut()}>Sair</button>
      </footer>
    </>
  );
}

function CartaoJogo({ jogo }: { jogo: Jogo }) {
  const platinado = jogo.progresso_pct === 100;
  return (
    <li>
      <a className="cartao jogo jogo-link" href={`${ROTA_JOGO}${jogo.id}`}>
        {jogo.icone_url
          ? <img className="jogo-icone" src={jogo.icone_url} alt="" width={64} height={64} loading="lazy" />
          : <div className="jogo-icone" />}
        <div className="jogo-info">
          <div className="jogo-titulo">
            <span className="jogo-nome">{jogo.nome}</span>
            <span className={platinado ? 'jogo-pct platinado' : 'jogo-pct'}>{jogo.progresso_pct}%</span>
          </div>
          <div className="barra-progresso" role="progressbar" aria-valuenow={jogo.progresso_pct} aria-valuemin={0} aria-valuemax={100}
            aria-label={`Progresso de ${jogo.nome}`}>
            <div style={{ width: `${jogo.progresso_pct}%` }} />
          </div>
          <span className="fraco jogo-detalhe">
            {jogo.plataforma}{jogo.ultima_sync ? ` · sincronizado ${quando(jogo.ultima_sync)}` : ''}
          </span>
        </div>
      </a>
    </li>
  );
}
