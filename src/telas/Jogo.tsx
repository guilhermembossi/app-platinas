import { useState } from 'react';
import { plataformaLegivel, quando } from '../dados/jogos';
import { filtrar, GRUPO_BASE, porBloco, useJogo, type Filtro, type Grupo, type Trofeu } from '../dados/trofeus';
import BotaoSincronizar from '../componentes/BotaoSincronizar';
import BotaoVoltar from '../componentes/BotaoVoltar';

export const ROTA_JOGO = '#/jogo/';

const FILTROS: { id: Filtro; nome: string }[] = [
  { id: 'todos', nome: 'Todos' },
  { id: 'faltando', nome: 'Faltando' },
  { id: 'missables', nome: 'Missables' },
];

const VAZIO: Record<Filtro, string> = {
  todos: 'Esse jogo não tem troféus.',
  faltando: 'Nenhum troféu faltando: 100%!',
  missables: 'Nenhum troféu marcado como missable.',
};

const TIPOS = { platina: 'Platina', ouro: 'Ouro', prata: 'Prata', bronze: 'Bronze' };

// A PSN dá ao jogo base o nome do próprio jogo; "Jogo base" deixa claro onde está a platina.
const nomeDoBloco = (g: Grupo) => (g.id === GRUPO_BASE ? 'Jogo base' : g.nome || `DLC ${g.id}`);

// Busca pronta para quando o jogo não tem guia na PowerPyx (normalmente o PSNProfiles aparece no topo).
const buscaDoGuia = (nome: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${nome} trophy guide`)}`;

// Tela do jogo: progresso, botão do guia, filtros e a lista de troféus.
export default function Jogo({ id }: { id: string }) {
  const { jogo, trofeus, erro, recarregar, alterarMissable } = useJogo(id);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [erroMissable, setErroMissable] = useState(false);
  const [fechados, setFechados] = useState<Set<string>>(() => new Set());

  function alternarBloco(grupoId: string, aberto: boolean) {
    setFechados((atual) => {
      if (aberto === !atual.has(grupoId)) return atual; // nada mudou (o React também dispara ao montar)
      const novo = new Set(atual);
      if (aberto) novo.delete(grupoId); else novo.add(grupoId);
      return novo;
    });
  }

  async function trocarMissable(t: Trofeu) {
    setErroMissable(false);
    if (!(await alterarMissable(t.id, !t.is_missable))) setErroMissable(true);
  }

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
  // Platina × 100% (7.0 item 1): a platina vale só pelo jogo base; 100% = todos os blocos.
  const base = trofeus.filter((t) => t.grupo_id === GRUPO_BASE);
  const temPlatina = base.some((t) => t.tipo === 'platina');
  const temDlc = jogo.grupos.length > 1;
  const blocos = porBloco(lista, jogo.grupos);

  return (
    <>
      <div className="barra-topo">
        <BotaoVoltar para="#/" rotulo="Voltar para Meus jogos" />
        <div className="cabecalho-acoes">
          <BotaoSincronizar gameId={jogo.id} aoTerminar={recarregar} />
        </div>
      </div>

      <section className="cartao jogo-topo">
        <div className="jogo">
          {jogo.icone_url
            ? <img className="jogo-icone" src={jogo.icone_url} alt="" width={64} height={64} />
            : <div className="jogo-icone" />}
          <div className="jogo-info">
            <h1 className="jogo-nome-grande">{jogo.nome}</h1>
            <span className="fraco jogo-detalhe">
              {plataformaLegivel(jogo.plataforma)}{jogo.ultima_sync ? ` · sincronizado ${quando(jogo.ultima_sync)}` : ''}
            </span>
          </div>
          <span className={jogo.progresso_pct === 100 ? 'jogo-pct platinado' : 'jogo-pct'}>{jogo.progresso_pct}%</span>
        </div>
        <div className="barra-progresso" role="progressbar" aria-valuenow={jogo.progresso_pct} aria-valuemin={0} aria-valuemax={100}
          aria-label="Progresso">
          <div style={{ width: `${jogo.progresso_pct}%` }} />
        </div>
        <ul className="metas">
          <li className={jogo.platinado ? 'meta feita' : 'meta'}>
            <span className="tipo tipo-platina" aria-hidden="true" />
            <span className="meta-nome">Platina</span>
            <span className="meta-valor">
              {!temPlatina ? 'esse jogo não tem'
                : jogo.platinado ? '✓ conquistada'
                  : `jogo base: ${base.filter((t) => t.conquistado).length} de ${base.length}`}
            </span>
          </li>
          <li className={conquistados === trofeus.length && trofeus.length > 0 ? 'meta feita' : 'meta'}>
            <span className="meta-nome">100%</span>
            <span className="meta-valor">
              {conquistados === trofeus.length && trofeus.length > 0 ? '✓ completo'
                : `${conquistados} de ${trofeus.length} troféus${temDlc ? ', com DLCs' : ''}`}
            </span>
          </li>
        </ul>
        {jogo.guia_url ? (
          <a className="botao-primario" href={jogo.guia_url} target="_blank" rel="noopener noreferrer">Abrir guia</a>
        ) : (
          // Sem guia na PowerPyx: o servidor não consegue buscar na web (bloqueado), o celular consegue.
          <>
            <a className="botao-secundario" href={buscaDoGuia(jogo.nome)} target="_blank" rel="noopener noreferrer">
              Procurar guia
            </a>
            <span className="fraco jogo-detalhe">Esse jogo não tem guia na PowerPyx. A busca abre no navegador.</span>
          </>
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

      {erroMissable && <p className="mensagem erro" role="alert">Não deu para salvar o missable. Tente de novo.</p>}

      {lista.length === 0 ? (
        <div className="cartao vazio"><p>{VAZIO[filtro]}</p></div>
      ) : (
        // Um bloco por parte do jogo, na ordem da PSN. Com DLC, cada bloco abre e fecha
        // (começam abertos; fechar vale enquanto a tela está aberta, inclusive trocando de filtro).
        blocos.map(({ grupo, trofeus: doBloco }) => {
          const itens = (
            <ul className="lista-trofeus">
              {doBloco.map((t) => <LinhaTrofeu key={t.id} trofeu={t} aoTrocarMissable={() => trocarMissable(t)} />)}
            </ul>
          );
          if (!temDlc) return <section key={grupo.id} className="bloco">{itens}</section>;
          const todosDoBloco = trofeus.filter((t) => t.grupo_id === grupo.id);
          return (
            <details key={grupo.id} className="bloco" open={!fechados.has(grupo.id)}
              onToggle={(e) => alternarBloco(grupo.id, e.currentTarget.open)}>
              <summary className="bloco-titulo">
                <span className="bloco-seta" aria-hidden="true" />
                <span className="bloco-nome">{nomeDoBloco(grupo)}</span>
                <span className="fraco">
                  {todosDoBloco.filter((t) => t.conquistado).length} de {todosDoBloco.length}
                </span>
              </summary>
              {itens}
            </details>
          );
        })
      )}
    </>
  );
}

function LinhaTrofeu({ trofeu: t, aoTrocarMissable }: { trofeu: Trofeu; aoTrocarMissable: () => void }) {
  return (
    // Conquistado (7.0 item 7): não fica mais apagado; ✓ verde no canto do ícone e a data na etiqueta.
    <li className={t.conquistado ? 'cartao trofeu feito' : 'cartao trofeu'}>
      <div className="trofeu-icone-caixa">
        {t.icone_url
          ? <img className="trofeu-icone" src={t.icone_url} alt="" width={48} height={48} loading="lazy" />
          : <div className="trofeu-icone" />}
        {t.conquistado && (
          <span className="selo-conquistado" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
              strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
        )}
      </div>
      <div className="trofeu-info">
        <div className="trofeu-titulo">
          <span className={`tipo tipo-${t.tipo}`} title={TIPOS[t.tipo]} aria-label={TIPOS[t.tipo]} />
          <span className="trofeu-nome">{t.nome}</span>
        </div>
        {t.descricao && <p className="trofeu-descricao">{t.descricao}</p>}
        <div className="etiquetas">
          {t.conquistado
            ? <span className="etiqueta ok">✓ {t.conquistado_em ? new Date(t.conquistado_em).toLocaleDateString('pt-BR') : 'Conquistado'}</span>
            : <span className="etiqueta">Faltando</span>}
          {t.is_missable && <span className="etiqueta alerta">Missable</span>}
          {t.oculto && <span className="etiqueta">Oculto</span>}
        </div>
      </div>
      {/* Bandeirinha à direita (7.0 item 6): cinza = não marcado; laranja e cheia = missable. */}
      <button type="button" className={t.is_missable ? 'bandeira marcada' : 'bandeira'} aria-pressed={t.is_missable}
        aria-label={t.is_missable ? `Desmarcar ${t.nome} como missable` : `Marcar ${t.nome} como missable`}
        onClick={aoTrocarMissable}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 22V4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 4h12l-2.5 4.5L17 13H5z" fill={t.is_missable ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  );
}
