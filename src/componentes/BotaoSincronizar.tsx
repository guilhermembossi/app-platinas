import { useState } from 'react';
import { mensagemPsn, sincronizarJogos } from '../dados/psn';

// Botão "Sincronizar" (tarefa 5.1): pede à PSN o progresso atual e recarrega a tela.
// Sem `gameId`, sincroniza todos os jogos adicionados.
export default function BotaoSincronizar({ gameId, aoTerminar }: { gameId?: string; aoTerminar: () => void }) {
  const [sincronizando, setSincronizando] = useState(false);
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  async function sincronizar() {
    setAviso(null);
    setSincronizando(true);
    try {
      const { falharam } = await sincronizarJogos(gameId);
      if (falharam > 0) {
        setAviso({ erro: true, texto: `${falharam} jogo${falharam > 1 ? 's' : ''} não sincronizou. Tente de novo.` });
      }
    } catch (err) {
      setAviso({ erro: true, texto: mensagemPsn(err) });
    } finally {
      setSincronizando(false);
      aoTerminar(); // também no erro: o início confere de novo se o token venceu (5.3)
    }
  }

  return (
    <>
      <button type="button" className="link sincronizar" onClick={sincronizar} disabled={sincronizando}>
        {sincronizando ? 'Sincronizando…' : '↻ Sincronizar'}
      </button>
      {aviso && <p className="mensagem erro" role="alert">{aviso.texto}</p>}
    </>
  );
}
