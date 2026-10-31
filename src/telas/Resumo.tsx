import { quando } from '../dados/jogos';
import { usePerfil } from '../dados/perfil';
import BotaoSincronizar from '../componentes/BotaoSincronizar';

export const ROTA_RESUMO = '#/resumo';

// Aba Resumo (7.0 item 3): perfil PSN (avatar, ID, nível), platinas, 100% e totais por tipo.
// Os números são da conta PSN inteira, como no perfil do console, não só dos jogos adicionados.
export default function Resumo() {
  const { perfil, erro, recarregar } = usePerfil();

  if (erro) {
    return (
      <div className="cartao vazio">
        <p>Não deu para carregar o resumo.</p>
        <button type="button" className="link" onClick={recarregar}>Tentar de novo</button>
      </div>
    );
  }
  if (perfil === null) return <p className="fraco" aria-busy="true">Carregando…</p>;

  return (
    <>
      <div className="cabecalho">
        <h1>Resumo</h1>
        <div className="cabecalho-acoes">
          <BotaoSincronizar aoTerminar={recarregar} />
        </div>
      </div>

      {perfil === 'vazio' ? (
        <div className="cartao vazio">
          <p>Ainda sem dados do perfil.</p>
          <p className="fraco">Toque em "↻ Sincronizar" para buscar na PSN.</p>
        </div>
      ) : (
        <>
          <section className="cartao perfil" aria-label="Perfil PSN">
            {perfil.avatar_url
              ? <img className="perfil-avatar" src={perfil.avatar_url} alt="" width={64} height={64} />
              : <div className="perfil-avatar" />}
            <div className="perfil-info">
              <span className="perfil-id">{perfil.online_id}</span>
              <span className="fraco">Nível {perfil.nivel}</span>
              <div className="barra-progresso" role="progressbar" aria-valuenow={perfil.nivel_progresso}
                aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso até o nível ${perfil.nivel + 1}`}>
                <div style={{ width: `${perfil.nivel_progresso}%` }} />
              </div>
              <span className="fraco jogo-detalhe">{perfil.nivel_progresso}% para o nível {perfil.nivel + 1}</span>
            </div>
          </section>

          <ul className="destaques">
            <li className="cartao destaque">
              <span className="destaque-valor">{perfil.platinas}</span>
              <span className="destaque-nome"><span className="tipo tipo-platina" aria-hidden="true" /> Platinas</span>
            </li>
            <li className="cartao destaque">
              <span className="destaque-valor">{perfil.completos}</span>
              <span className="destaque-nome">Jogos com 100%</span>
            </li>
          </ul>

          <section className="cartao" aria-label="Troféus por tipo">
            <h2 className="secao-titulo">Troféus conquistados</h2>
            <ul className="por-tipo">
              {([
                ['platina', 'Platina', perfil.platinas],
                ['ouro', 'Ouro', perfil.ouro],
                ['prata', 'Prata', perfil.prata],
                ['bronze', 'Bronze', perfil.bronze],
              ] as const).map(([tipo, nome, valor]) => (
                <li key={tipo}>
                  <span className={`tipo tipo-${tipo}`} aria-hidden="true" />
                  <span className="por-tipo-valor">{valor}</span>
                  <span className="fraco">{nome}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="fraco jogo-detalhe">
            Números da sua conta PSN inteira · atualizado {quando(perfil.atualizado_em)}
          </p>
        </>
      )}
    </>
  );
}
