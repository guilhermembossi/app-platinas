// Botão de voltar redondo, só com ícone (7.0 item 4). É um link para a tela anterior.
export default function BotaoVoltar({ para, rotulo }: { para: string; rotulo: string }) {
  return (
    <a className="botao-redondo" href={para} aria-label={rotulo}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
    </a>
  );
}
