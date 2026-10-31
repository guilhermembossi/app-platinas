import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { quando, useJogos, type Jogo } from '../dados/jogos';
import { supabase } from '../supabase';
import { useTokenVencido } from '../dados/estadoPsn';
import AvisoToken from '../componentes/AvisoToken';
import BotaoSincronizar from '../componentes/BotaoSincronizar';
import { ROTA_JOGO } from './Jogo';

export const ROTA_ADICIONAR = '#/adicionar';

// Tela inicial: os jogos adicionados com ícone, % e barra, e a última sincronização de cada um.
export default function Inicio({ sessao }: { sessao: Session }) {
  const { jogos, erro, recarregar, alterarFixado } = useJogos();
  const { vencido, conferir } = useTokenVencido();
  const [erroFixar, setErroFixar] = useState(false);

  async function trocarFixado(j: Jogo) {
    setErroFixar(false);
    if (!(await alterarFixado(j.id, !j.fixado))) setErroFixar(true);
  }

  return (
    <>
      <div className="cabecalho">
        <h1>Meus jogos</h1>
        <div className="cabecalho-acoes">
          {jogos && jogos.length > 0 && <BotaoSincronizar aoTerminar={() => { recarregar(); conferir(); }} />}
          <a className="botao-primario botao-pequeno" href={ROTA_ADICIONAR}>+ Adicionar jogo</a>
        </div>
      </div>
      {vencido && <AvisoToken />}

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
        <>
          {erroFixar && <p className="mensagem erro" role="alert">Não deu para fixar o jogo. Tente de novo.</p>}
          <ul className="lista-jogos">
            {jogos.map((j) => <CartaoJogo key={j.id} jogo={j} aoTrocarFixado={() => trocarFixado(j)} />)}
          </ul>
        </>
      )}

      <footer className="rodape">
        <span className="fraco">{sessao.user.email}</span>
        <button type="button" className="link" onClick={() => supabase.auth.signOut()}>Sair</button>
      </footer>
    </>
  );
}

// Platina (só jogo base) e 100% (todos os blocos) são coisas diferentes (7.0 item 1).
// A estrela fica fora do link (botão dentro de link não é permitido) e fixa o jogo no topo (item 2).
function CartaoJogo({ jogo, aoTrocarFixado }: { jogo: Jogo; aoTrocarFixado: () => void }) {
  const completo = jogo.progresso_pct === 100;
  return (
    <li className="cartao cartao-jogo">
      <button type="button" className={jogo.fixado ? 'estrela fixada' : 'estrela'} aria-pressed={jogo.fixado}
        aria-label={jogo.fixado ? `Desafixar ${jogo.nome}` : `Fixar ${jogo.nome} no topo`} onClick={aoTrocarFixado}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
            fill={jogo.fixado ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </button>
      <a className="jogo jogo-link" href={`${ROTA_JOGO}${jogo.id}`}>
        {jogo.icone_url
          ? <img className="jogo-icone" src={jogo.icone_url} alt="" width={64} height={64} loading="lazy" />
          : <div className="jogo-icone" />}
        <div className="jogo-info">
          <div className="jogo-titulo">
            <span className="jogo-nome">{jogo.nome}</span>
            <span className={completo ? 'jogo-pct platinado' : 'jogo-pct'}>{jogo.progresso_pct}%</span>
          </div>
          {jogo.platinado && (
            <div className="etiquetas">
              <span className="etiqueta platina">✓ Platina</span>
              {completo && <span className="etiqueta ok">✓ 100%</span>}
            </div>
          )}
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
