import { useState, type FormEvent } from 'react';
import { adicionarJogo, buscarJogos, mensagemPsn, procurarGuia, type Guia, type JogoDaConta } from '../dados/psn';
import BotaoVoltar from '../componentes/BotaoVoltar';
import { useIdioma, type Textos } from '../i18n';
import { ROTA_JOGO } from './Jogo';

// Andamento do "Adicionar" (7.0 item 8). Cada passo só vira ✓ quando o servidor responde.
type Andamento = {
  np: string;
  passo: 'trofeus' | 'guia' | 'pronto';
  jogoId?: string;
  trofeus?: number;
  guia?: Guia | null;
  erroGuia?: boolean;
};

// Buscar um jogo entre os títulos da conta PSN e adicionar, mostrando os passos.
export default function Adicionar() {
  const { t } = useIdioma();
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<JogoDaConta[] | null>(null);
  const [andamento, setAndamento] = useState<Andamento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ocupado = andamento !== null && andamento.passo !== 'pronto';

  async function buscar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAndamento(null);
    setBuscando(true);
    try {
      setResultados(await buscarJogos(termo.trim()));
    } catch (err) {
      setErro(mensagemPsn(err, t));
    } finally {
      setBuscando(false);
    }
  }

  async function adicionar(jogo: JogoDaConta) {
    setErro(null);
    setAndamento({ np: jogo.np_communication_id, passo: 'trofeus' });
    let adicionado: { id: string; trofeus: number };
    try {
      adicionado = await adicionarJogo(jogo.np_communication_id);
    } catch (err) {
      setErro(mensagemPsn(err, t));
      setAndamento(null);
      return;
    }
    setAndamento({ np: jogo.np_communication_id, passo: 'guia', jogoId: adicionado.id, trofeus: adicionado.trofeus });
    // O jogo já foi adicionado: se o guia falhar, termina assim mesmo (a tela do jogo oferece "Procurar guia").
    let guia: Guia | null = null;
    let erroGuia = false;
    try {
      guia = await procurarGuia(adicionado.id);
    } catch {
      erroGuia = true;
    }
    setAndamento({ np: jogo.np_communication_id, passo: 'pronto', jogoId: adicionado.id, trofeus: adicionado.trofeus, guia, erroGuia });
    setResultados((rs) => rs && rs.map((r) => (r.np_communication_id === jogo.np_communication_id ? { ...r, ja_adicionado: true } : r)));
  }

  return (
    <>
      <div className="cabecalho cabecalho-com-voltar">
        <BotaoVoltar para="#/" rotulo={t.voltarMeusJogos} />
        <h1>{t.tituloAdicionar}</h1>
      </div>

      <form className="busca" onSubmit={buscar}>
        <input type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder={t.nomeDoJogo}
          aria-label={t.nomeDoJogo} enterKeyHint="search" minLength={2} required autoFocus />
        <button className="botao-primario botao-pequeno" type="submit" disabled={buscando || ocupado}>
          {buscando ? t.buscando : t.buscar}
        </button>
      </form>
      <p className="fraco dica-busca">{t.dicaBusca}</p>

      {erro && <p className="mensagem erro" role="alert">{erro}</p>}

      {resultados !== null && !buscando && (resultados.length === 0 ? (
        <div className="cartao vazio"><p>{t.nenhumResultado}</p></div>
      ) : (
        <ul className="lista-jogos">
          {resultados.map((j) => {
            const meu = andamento?.np === j.np_communication_id ? andamento : null;
            return (
              <li key={j.np_communication_id} className="cartao resultado">
                <div className="jogo">
                  <img className="jogo-icone" src={j.icone_url} alt="" width={64} height={64} loading="lazy" />
                  <div className="jogo-info">
                    <span className="jogo-nome">{j.nome}</span>
                    <span className="fraco jogo-detalhe">{j.plataforma} · {j.progresso_pct}%</span>
                  </div>
                  {meu ? null : j.ja_adicionado ? (
                    <span className="fraco jogo-detalhe">{t.jaAdicionado}</span>
                  ) : (
                    <button type="button" className="botao-primario botao-pequeno" onClick={() => adicionar(j)}
                      disabled={ocupado}>
                      {t.adicionar}
                    </button>
                  )}
                </div>
                {meu && <Passos andamento={meu} t={t} />}
              </li>
            );
          })}
        </ul>
      ))}
    </>
  );
}

function Passos({ andamento: a, t }: { andamento: Andamento; t: Textos }) {
  const trofeus = a.passo === 'trofeus'
    ? { estado: 'agora', texto: t.importando }
    : { estado: 'feito', texto: t.importados(a.trofeus ?? 0) };
  const guia = a.passo === 'trofeus' ? { estado: 'depois', texto: t.guia }
    : a.passo === 'guia' ? { estado: 'agora', texto: t.procurandoGuia }
      : a.guia ? { estado: 'feito', texto: t.guiaAchado }
        : { estado: 'aviso', texto: a.erroGuia ? t.guiaErro : t.guiaNenhum };
  const pronto = a.passo === 'pronto' ? { estado: 'feito', texto: t.pronto } : { estado: 'depois', texto: t.pronto };

  return (
    <div className="passos">
      <ol aria-live="polite">
        {[trofeus, guia, pronto].map((p, i) => (
          <li key={i} className={`passo passo-${p.estado}`}>
            <span className="passo-marca" aria-hidden="true">
              {p.estado === 'feito' ? '✓' : p.estado === 'aviso' ? '!' : ''}
            </span>
            {p.texto}
          </li>
        ))}
      </ol>
      {a.passo === 'pronto' && a.jogoId && (
        <div className="passos-acoes">
          <a className="botao-primario botao-pequeno" href={`${ROTA_JOGO}${a.jogoId}`}>{t.abrirJogo}</a>
          <a className="link" href="#/">{t.voltarMeusJogos}</a>
        </div>
      )}
    </div>
  );
}
