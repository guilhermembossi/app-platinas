import { useState, type FormEvent } from 'react';
import { adicionarJogo, buscarJogos, mensagemPsn, type JogoDaConta } from '../dados/psn';

// Buscar um jogo entre os títulos da conta PSN e adicionar. Ao adicionar, volta para o início.
export default function Adicionar() {
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<JogoDaConta[] | null>(null);
  const [adicionando, setAdicionando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
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
    setAdicionando(jogo.np_communication_id);
    try {
      await adicionarJogo(jogo.np_communication_id);
      location.hash = '#/';
    } catch (err) {
      setErro(mensagemPsn(err));
      setAdicionando(null);
    }
  }

  return (
    <>
      <div className="cabecalho">
        <h1>Adicionar jogo</h1>
        <a className="link" href="#/">Voltar</a>
      </div>

      <form className="busca" onSubmit={buscar}>
        <input type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome do jogo"
          aria-label="Nome do jogo" enterKeyHint="search" minLength={2} required autoFocus />
        <button className="botao-primario botao-pequeno" type="submit" disabled={buscando || adicionando !== null}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      <p className="fraco dica-busca">Só aparecem jogos que você já abriu no console (os que têm troféus na sua conta).</p>

      {erro && <p className="mensagem erro" role="alert">{erro}</p>}

      {resultados !== null && !buscando && (resultados.length === 0 ? (
        <div className="cartao vazio"><p>Nenhum jogo da sua conta com esse nome.</p></div>
      ) : (
        <ul className="lista-jogos">
          {resultados.map((j) => (
            <li key={j.np_communication_id} className="cartao jogo">
              <img className="jogo-icone" src={j.icone_url} alt="" width={64} height={64} loading="lazy" />
              <div className="jogo-info">
                <span className="jogo-nome">{j.nome}</span>
                <span className="fraco jogo-detalhe">{j.plataforma} · {j.progresso_pct}%</span>
              </div>
              {j.ja_adicionado ? (
                <span className="fraco jogo-detalhe">Já adicionado</span>
              ) : (
                <button type="button" className="botao-primario botao-pequeno" onClick={() => adicionar(j)}
                  disabled={adicionando !== null}>
                  {adicionando === j.np_communication_id ? 'Adicionando…' : 'Adicionar'}
                </button>
              )}
            </li>
          ))}
        </ul>
      ))}
    </>
  );
}
