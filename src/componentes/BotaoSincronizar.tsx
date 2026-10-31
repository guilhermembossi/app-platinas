import { useState } from 'react';
import { mensagemPsn, sincronizarJogos } from '../dados/psn';

// Botão "Sincronizar" (tarefa 5.1): pede à PSN o progresso atual e recarrega a tela.
// Sem `gameId`, sincroniza todos os jogos adicionados. Redondo, só com ícone (7.0 item 4):
// o ícone gira enquanto sincroniza; o aviso de erro aparece logo abaixo.
export default function BotaoSincronizar({ gameId, aoTerminar }: { gameId?: string; aoTerminar: () => void }) {
  const [sincronizando, setSincronizando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function sincronizar() {
    setAviso(null);
    setSincronizando(true);
    try {
      const { falharam } = await sincronizarJogos(gameId);
      if (falharam > 0) setAviso(`${falharam} jogo${falharam > 1 ? 's' : ''} não sincronizou. Tente de novo.`);
    } catch (err) {
      setAviso(mensagemPsn(err));
    } finally {
      setSincronizando(false);
      aoTerminar(); // também no erro: o início confere de novo se o token venceu (5.3)
    }
  }

  return (
    <>
      <button type="button" className={sincronizando ? 'botao-redondo girando' : 'botao-redondo'}
        onClick={sincronizar} disabled={sincronizando}
        aria-label={sincronizando ? 'Sincronizando…' : gameId ? 'Sincronizar este jogo' : 'Sincronizar todos os jogos'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
          <path d="M21 3v5h-5" /><path d="M3 21v-5h5" />
        </svg>
      </button>
      {aviso && <p className="mensagem erro aviso-sync" role="alert">{aviso}</p>}
    </>
  );
}
