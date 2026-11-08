import { useState } from 'react';
import { plataformaLegivel } from '../dados/jogos';
import { dataCompleta, quando, useIdioma, type Idioma, type Textos } from '../i18n';
import { filtrar, GRUPO_BASE, porBloco, raridade, useJogo, type Filtro, type Grupo, type Trofeu } from '../dados/trofeus';
import BotaoSincronizar from '../componentes/BotaoSincronizar';
import BotaoVoltar from '../componentes/BotaoVoltar';

export const ROTA_JOGO = '#/jogo/';

const FILTROS: Filtro[] = ['todos', 'faltando', 'missables'];

// A PSN dá ao jogo base o nome do próprio jogo; "Jogo base" deixa claro onde está a platina.
// Em inglês (7.1.1), o nome do bloco na PSN em inglês.
const nomeDoBloco = (g: Grupo, idioma: Idioma, t: Textos) =>
  g.id === GRUPO_BASE ? t.jogoBase : (idioma === 'en' ? g.nome_en || g.nome : g.nome) || `DLC ${g.id}`;

// Busca pronta para quando o jogo não tem guia na PowerPyx (normalmente o PSNProfiles aparece no topo).
const buscaDoGuia = (nome: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${nome} trophy guide`)}`;

// Tela do jogo: progresso, botão do guia, filtros e a lista de troféus.
export default function Jogo({ id }: { id: string }) {
  const { idioma, t } = useIdioma();
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

  async function trocarMissable(x: Trofeu) {
    setErroMissable(false);
    if (!(await alterarMissable(x.id, !x.is_missable))) setErroMissable(true);
  }

  if (erro) {
    return (
      <div className="cartao vazio">
        <p>{t.erroJogo}</p>
        <button type="button" className="link" onClick={recarregar}>{t.tentarDeNovo}</button>
      </div>
    );
  }
  if (jogo === null) return <p className="fraco" aria-busy="true">{t.carregando}</p>;
  if (jogo === 'nao_encontrado') {
    return (
      <div className="cartao vazio">
        <p>{t.jogoNaoEncontrado}</p>
        <a className="link" href="#/">{t.voltar}</a>
      </div>
    );
  }

  const conquistados = trofeus.filter((x) => x.conquistado).length;
  const lista = filtrar(trofeus, filtro);
  // Platina × 100% (7.0 item 1): a platina vale só pelo jogo base; 100% = todos os blocos.
  const base = trofeus.filter((x) => x.grupo_id === GRUPO_BASE);
  const temPlatina = base.some((x) => x.tipo === 'platina');
  const temDlc = jogo.grupos.length > 1;
  const blocos = porBloco(lista, jogo.grupos);

  return (
    <>
      <div className="barra-topo">
        <BotaoVoltar para="#/" rotulo={t.voltarMeusJogos} />
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
              {plataformaLegivel(jogo.plataforma)}{jogo.ultima_sync ? ` · ${t.sincronizado(quando(jogo.ultima_sync, t))}` : ''}
            </span>
          </div>
          <span className={jogo.progresso_pct === 100 ? 'jogo-pct platinado' : 'jogo-pct'}>{jogo.progresso_pct}%</span>
        </div>
        <div className="barra-progresso" role="progressbar" aria-valuenow={jogo.progresso_pct} aria-valuemin={0} aria-valuemax={100}
          aria-label={t.progresso}>
          <div style={{ width: `${jogo.progresso_pct}%` }} />
        </div>
        <ul className="metas">
          <li className={jogo.platinado ? 'meta feita' : 'meta'}>
            <span className="tipo tipo-platina" aria-hidden="true" />
            <span className="meta-nome">{t.tipos.platina}</span>
            <span className="meta-valor">
              {!temPlatina ? t.semPlatina
                : jogo.platinado ? t.platinaFeita
                  : t.platinaBase(base.filter((x) => x.conquistado).length, base.length)}
            </span>
          </li>
          <li className={conquistados === trofeus.length && trofeus.length > 0 ? 'meta feita' : 'meta'}>
            <span className="meta-nome">100%</span>
            <span className="meta-valor">
              {conquistados === trofeus.length && trofeus.length > 0 ? t.completo
                : t.trofeus100(conquistados, trofeus.length, temDlc)}
            </span>
          </li>
        </ul>
        {jogo.guia_url ? (
          <a className="botao-primario" href={jogo.guia_url} target="_blank" rel="noopener noreferrer">{t.abrirGuia}</a>
        ) : (
          // Sem guia na PowerPyx: o servidor não consegue buscar na web (bloqueado), o celular consegue.
          <>
            <a className="botao-secundario" href={buscaDoGuia(jogo.nome)} target="_blank" rel="noopener noreferrer">
              {t.procurarGuia}
            </a>
            <span className="fraco jogo-detalhe">{t.semGuia}</span>
          </>
        )}
      </section>

      <div className="filtros" role="tablist" aria-label={t.filtrarTrofeus}>
        {FILTROS.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filtro === f}
            className="filtro" onClick={() => setFiltro(f)}>
            {t.filtros[f]} <span className="filtro-n">{filtrar(trofeus, f).length}</span>
          </button>
        ))}
      </div>

      {erroMissable && <p className="mensagem erro" role="alert">{t.erroMissable}</p>}

      {lista.length === 0 ? (
        <div className="cartao vazio"><p>{t.vazio[filtro]}</p></div>
      ) : (
        // Um bloco por parte do jogo, na ordem da PSN. Com DLC, cada bloco abre e fecha
        // (começam abertos; fechar vale enquanto a tela está aberta, inclusive trocando de filtro).
        blocos.map(({ grupo, trofeus: doBloco }) => {
          const itens = (
            <ul className="lista-trofeus">
              {doBloco.map((x) => <LinhaTrofeu key={x.id} trofeu={x} aoTrocarMissable={() => trocarMissable(x)} />)}
            </ul>
          );
          if (!temDlc) return <section key={grupo.id} className="bloco">{itens}</section>;
          const todosDoBloco = trofeus.filter((x) => x.grupo_id === grupo.id);
          return (
            <details key={grupo.id} className="bloco" open={!fechados.has(grupo.id)}
              onToggle={(e) => alternarBloco(grupo.id, e.currentTarget.open)}>
              <summary className="bloco-titulo">
                <span className="bloco-seta" aria-hidden="true" />
                <span className="bloco-nome">{nomeDoBloco(grupo, idioma, t)}</span>
                <span className="fraco">
                  {t.deTotal(todosDoBloco.filter((x) => x.conquistado).length, todosDoBloco.length)}
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

function LinhaTrofeu({ trofeu: tr, aoTrocarMissable }: { trofeu: Trofeu; aoTrocarMissable: () => void }) {
  const { idioma, t } = useIdioma();
  const rar = raridade(tr.raridade_pct);
  // Em inglês (7.1.1): nome e descrição da PSN em inglês (gravados desde a 2.3).
  const nome = idioma === 'en' ? tr.nome_en || tr.nome : tr.nome;
  const descricao = idioma === 'en' ? tr.descricao_en || tr.descricao : tr.descricao;
  return (
    // Conquistado (7.0 item 7): não fica mais apagado; ✓ verde no canto do ícone e a data na etiqueta.
    <li className={tr.conquistado ? 'cartao trofeu feito' : 'cartao trofeu'}>
      <div className="trofeu-icone-caixa">
        {tr.icone_url
          ? <img className="trofeu-icone" src={tr.icone_url} alt="" width={48} height={48} loading="lazy" />
          : <div className="trofeu-icone" />}
        {tr.conquistado && (
          <span className="selo-conquistado" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
              strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
        )}
      </div>
      <div className="trofeu-info">
        <div className="trofeu-titulo">
          <span className={`tipo tipo-${tr.tipo}`} title={t.tipos[tr.tipo]} aria-label={t.tipos[tr.tipo]} />
          <span className="trofeu-nome">{nome}</span>
        </div>
        {descricao && <p className="trofeu-descricao">{descricao}</p>}
        <div className="etiquetas">
          {tr.conquistado
            ? <span className="etiqueta ok">✓ {tr.conquistado_em ? dataCompleta(tr.conquistado_em, t) : t.conquistado}</span>
            : <span className="etiqueta">{t.faltando}</span>}
          {rar && (
            <span className={`etiqueta raridade ${rar}`}>
              {t.raridades[rar]} · {tr.raridade_pct!.toLocaleString(t.local, { maximumFractionDigits: 1 })}%
            </span>
          )}
          {tr.is_missable && <span className="etiqueta alerta">Missable</span>}
          {tr.oculto && <span className="etiqueta">{t.oculto}</span>}
        </div>
      </div>
      {/* Bandeirinha à direita (7.0 item 6): cinza = não marcado; laranja e cheia = missable. */}
      <button type="button" className={tr.is_missable ? 'bandeira marcada' : 'bandeira'} aria-pressed={tr.is_missable}
        aria-label={tr.is_missable ? t.desmarcarMissable(nome) : t.marcarMissable(nome)}
        onClick={aoTrocarMissable}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 22V4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 4h12l-2.5 4.5L17 13H5z" fill={tr.is_missable ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  );
}
