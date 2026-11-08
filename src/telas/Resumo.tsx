import { useState } from 'react';
import { usePerfil } from '../dados/perfil';
import { quando, useIdioma, type Idioma } from '../i18n';
import BotaoSincronizar from '../componentes/BotaoSincronizar';

export const ROTA_RESUMO = '#/resumo';

// Aba Resumo (7.0 item 3): perfil PSN (avatar, ID, nível), platinas, 100% e totais por tipo.
// Os números são da conta PSN inteira, como no perfil do console, não só dos jogos adicionados.
// Embaixo, o idioma do app (7.1.1).
export default function Resumo() {
  const { t } = useIdioma();
  const { perfil, erro, recarregar } = usePerfil();

  if (erro) {
    return (
      <>
        <div className="cartao vazio">
          <p>{t.erroResumo}</p>
          <button type="button" className="link" onClick={recarregar}>{t.tentarDeNovo}</button>
        </div>
        <EscolhaIdioma />
      </>
    );
  }
  if (perfil === null) return <p className="fraco" aria-busy="true">{t.carregando}</p>;

  return (
    <>
      <div className="cabecalho">
        <h1>{t.resumo}</h1>
        <div className="cabecalho-acoes">
          <BotaoSincronizar aoTerminar={recarregar} />
        </div>
      </div>

      {perfil === 'vazio' ? (
        <div className="cartao vazio">
          <p>{t.semPerfil}</p>
          <p className="fraco">{t.dicaSemPerfil}</p>
        </div>
      ) : (
        <>
          <section className="cartao perfil" aria-label={t.perfilPsn}>
            {perfil.avatar_url
              ? <img className="perfil-avatar" src={perfil.avatar_url} alt="" width={64} height={64} />
              : <div className="perfil-avatar" />}
            <div className="perfil-info">
              <span className="perfil-id">{perfil.online_id}</span>
              <span className="fraco">{t.nivel(perfil.nivel)}</span>
              <div className="barra-progresso" role="progressbar" aria-valuenow={perfil.nivel_progresso}
                aria-valuemin={0} aria-valuemax={100} aria-label={t.progressoNivel(perfil.nivel + 1)}>
                <div style={{ width: `${perfil.nivel_progresso}%` }} />
              </div>
              <span className="fraco jogo-detalhe">{t.paraNivel(perfil.nivel_progresso, perfil.nivel + 1)}</span>
            </div>
          </section>

          <ul className="destaques">
            <li className="cartao destaque">
              <span className="destaque-valor">{perfil.platinas}</span>
              <span className="destaque-nome"><span className="tipo tipo-platina" aria-hidden="true" /> {t.platinas}</span>
            </li>
            <li className="cartao destaque">
              <span className="destaque-valor">{perfil.completos}</span>
              <span className="destaque-nome">{t.jogos100}</span>
            </li>
          </ul>

          <section className="cartao" aria-label={t.trofeusPorTipo}>
            <h2 className="secao-titulo">{t.trofeusConquistados}</h2>
            <ul className="por-tipo">
              {([
                ['platina', perfil.platinas],
                ['ouro', perfil.ouro],
                ['prata', perfil.prata],
                ['bronze', perfil.bronze],
              ] as const).map(([tipo, valor]) => (
                <li key={tipo}>
                  <span className={`tipo tipo-${tipo}`} aria-hidden="true" />
                  <span className="por-tipo-valor">{valor}</span>
                  <span className="fraco">{t.tipos[tipo]}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="fraco jogo-detalhe">{t.contaInteira(quando(perfil.atualizado_em, t))}</p>
        </>
      )}

      <EscolhaIdioma />
    </>
  );
}

// PT | EN (7.1.1): o idioma atual fica marcado. Salva no banco e vale até trocar de novo.
function EscolhaIdioma() {
  const { idioma, t, trocar } = useIdioma();
  const [erro, setErro] = useState(false);

  async function escolher(novo: Idioma) {
    if (novo === idioma) return;
    setErro(false);
    if (!(await trocar(novo))) setErro(true);
  }

  return (
    <section className="cartao idioma" aria-labelledby="idioma-titulo">
      <div className="idioma-linha">
        <div>
          <h2 id="idioma-titulo" className="secao-titulo">{t.idioma}</h2>
          <p className="fraco jogo-detalhe">{t.dicaIdioma}</p>
        </div>
        <div className="seletor-idioma" role="group" aria-labelledby="idioma-titulo">
          {(['pt', 'en'] as const).map((op) => (
            <button key={op} type="button" aria-pressed={idioma === op} lang={op === 'pt' ? 'pt-BR' : 'en-US'}
              aria-label={op === 'pt' ? 'Português' : 'English'} onClick={() => escolher(op)}>
              {op.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {erro && <p className="mensagem erro" role="alert">{t.erroIdioma}</p>}
    </section>
  );
}
