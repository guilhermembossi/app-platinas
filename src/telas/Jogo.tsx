import { useState } from 'react';
import { quando } from '../dados/jogos';
import { filtrar, useJogo, type Filtro, type Trofeu } from '../dados/trofeus';

export const ROTA_JOGO = '#/jogo/';

const FILTROS: { id: Filtro; nome: string }[] = [
  { id: 'todos', nome: 'Todos' },
  { id: 'faltando', nome: 'Faltando' },
  { id: 'missables', nome: 'Missables' },
];

const VAZIO: Record<Filtro, string> = {
  todos: 'Esse jogo não tem troféus.',
  faltando: 'Nenhum troféu faltando. Platinado!',
  missables: 'Nenhum troféu marcado como missable.',
};

const TIPOS = { platina: 'Platina', ouro: 'Ouro', prata: 'Prata', bronze: 'Bronze' };

// Tela do jogo: progresso, botão do guia, filtros e a lista de troféus.
export default function Jogo({ id }: { id: string }) {
  const { jogo, trofeus, erro, recarregar } = useJogo(id);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  if (erro) {
    return (
      <div className="cartao vazio">
        <p>Não deu para carregar esse jogo.</p>
        <button type="button" className="link" onClick={recarregar}>Tentar de novo</button>
      </div>
    );
  }
  if (jogo === null) return <p className="fraco" aria-busy="true">Carregando…</p>;
  if (jogo === 'nao_encontrado') {
    return (
      <div className="cartao vazio">
        <p>Jogo não encontrado.</p>
        <a className="link" href="#/">Voltar</a>
      </div>
    );
  }

  const conquistados = trofeus.filter((t) => t.conquistado).length;
  const lista = filtrar(trofeus, filtro);

  return (
    <>
      <a className="link voltar" href="#/">‹ Meus jogos</a>

      <section className="cartao jogo-topo">
        <div className="jogo">
          {jogo.icone_url
            ? <img className="jogo-icone" src={jogo.icone_url} alt="" width={64} height={64} />
            : <div className="jogo-icone" />}
          <div className="jogo-info">
            <h1 className="jogo-nome-grande">{jogo.nome}</h1>
            <span className="fraco jogo-detalhe">
              {jogo.plataforma} · {conquistados} de {trofeus.length} troféus
              {jogo.ultima_sync ? ` · sincronizado ${quando(jogo.ultima_sync)}` : ''}
            </span>
          </div>
          <span className={jogo.progresso_pct === 100 ? 'jogo-pct platinado' : 'jogo-pct'}>{jogo.progresso_pct}%</span>
        </div>
        <div className="barra-progresso" role="progressbar" aria-valuenow={jogo.progresso_pct} aria-valuemin={0} aria-valuemax={100}
          aria-label="Progresso">
          <div style={{ width: `${jogo.progresso_pct}%` }} />
        </div>
        {jogo.guia_url ? (
          <a className="botao-primario" href={jogo.guia_url} target="_blank" rel="noopener noreferrer">Abrir guia</a>
        ) : (
          <button type="button" className="botao-primario" disabled>Guia ainda não encontrado</button>
        )}
      </section>

      <div className="filtros" role="tablist" aria-label="Filtrar troféus">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id}
            className="filtro" onClick={() => setFiltro(f.id)}>
            {f.nome} <span className="filtro-n">{filtrar(trofeus, f.id).length}</span>
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="cartao vazio"><p>{VAZIO[filtro]}</p></div>
      ) : (
        <ul className="lista-trofeus">
          {lista.map((t) => <LinhaTrofeu key={t.id} trofeu={t} />)}
        </ul>
      )}
    </>
  );
}

function LinhaTrofeu({ trofeu: t }: { trofeu: Trofeu }) {
  return (
    <li className={t.conquistado ? 'cartao trofeu feito' : 'cartao trofeu'}>
      {t.icone_url
        ? <img className="trofeu-icone" src={t.icone_url} alt="" width={48} height={48} loading="lazy" />
        : <div className="trofeu-icone" />}
      <div className="trofeu-info">
        <div className="trofeu-titulo">
          <span className={`tipo tipo-${t.tipo}`} title={TIPOS[t.tipo]} aria-label={TIPOS[t.tipo]} />
          <span className="trofeu-nome">{t.nome}</span>
        </div>
        {t.descricao && <p className="trofeu-descricao">{t.descricao}</p>}
        <div className="etiquetas">
          {t.conquistado
            ? <span className="etiqueta ok">✓ Conquistado{t.conquistado_em ? ` em ${new Date(t.conquistado_em).toLocaleDateString('pt-BR')}` : ''}</span>
            : <span className="etiqueta">Faltando</span>}
          {t.is_missable && <span className="etiqueta alerta">Missable</span>}
          {t.oculto && <span className="etiqueta">Oculto</span>}
        </div>
      </div>
    </li>
  );
}
