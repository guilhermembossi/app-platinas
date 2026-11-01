import { useState, type FormEvent } from 'react';
import { adicionarJogo, buscarJogos, mensagemPsn, procurarGuia, type Guia, type JogoDaConta } from '../dados/psn';
import BotaoVoltar from '../componentes/BotaoVoltar';
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
      setErro(mensagemPsn(err));
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
      setErro(mensagemPsn(err));
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
        <BotaoVoltar para="#/" rotulo="Voltar para Meus jogos" />
        <h1>Adicionar jogo</h1>
      </div>

      <form className="busca" onSubmit={buscar}>
        <input type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome do jogo"
          aria-label="Nome do jogo" enterKeyHint="search" minLength={2} required autoFocus />
        <button className="botao-primario botao-pequeno" type="submit" disabled={buscando || ocupado}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      <p className="fraco dica-busca">Só aparecem jogos que você já abriu no console (os que têm troféus na sua conta).</p>

      {erro && <p className="mensagem erro" role="alert">{erro}</p>}

      {resultados !== null && !buscando && (resultados.length === 0 ? (
        <div className="cartao vazio"><p>Nenhum jogo da sua conta com esse nome.</p></div>
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
                    <span className="fraco jogo-detalhe">Já adicionado</span>
                  ) : (
                    <button type="button" className="botao-primario botao-pequeno" onClick={() => adicionar(j)}
                      disabled={ocupado}>
                      Adicionar
                    </button>
                  )}
                </div>
                {meu && <Passos andamento={meu} />}
              </li>
            );
          })}
        </ul>
      ))}
    </>
  );
}

function Passos({ andamento: a }: { andamento: Andamento }) {
  const trofeus = a.passo === 'trofeus'
    ? { estado: 'agora', texto: 'Importando troféus e progresso…' }
    : { estado: 'feito', texto: `Troféus e progresso importados (${a.trofeus})` };
  const guia = a.passo === 'trofeus' ? { estado: 'depois', texto: 'Guia' }
    : a.passo === 'guia' ? { estado: 'agora', texto: 'Procurando o guia na PowerPyx…' }
      : a.guia ? { estado: 'feito', texto: 'Guia encontrado na PowerPyx' }
        : { estado: 'aviso', texto: a.erroGuia ? 'Não deu para procurar o guia agora' : 'Sem guia na PowerPyx (a busca fica na tela do jogo)' };
  const pronto = a.passo === 'pronto' ? { estado: 'feito', texto: 'Pronto' } : { estado: 'depois', texto: 'Pronto' };

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
          <a className="botao-primario botao-pequeno" href={`${ROTA_JOGO}${a.jogoId}`}>Abrir o jogo</a>
          <a className="link" href="#/">Voltar para Meus jogos</a>
        </div>
      )}
    </div>
  );
}
