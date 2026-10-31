// Aviso de acesso à PSN vencido (tarefa 5.3), com o passo a passo para gerar um NPSSO novo.
// O código nunca passa pelo app: vai direto do site da Sony para o cofre do Supabase.
export default function AvisoToken() {
  return (
    <section className="cartao aviso-token" role="alert">
      <h2>O acesso à PSN venceu</h2>
      <p>Os jogos não estão sincronizando. Gere um código novo (NPSSO) no computador:</p>
      <ol>
        <li>Entre em <a href="https://www.playstation.com" target="_blank" rel="noopener noreferrer">playstation.com</a> com a sua conta.</li>
        <li>Na mesma janela, abra <a href="https://ca.account.sony.com/api/v1/ssocookie" target="_blank" rel="noopener noreferrer">ca.account.sony.com/api/v1/ssocookie</a>.</li>
        <li>Copie só o código entre aspas depois de <code>npsso</code> (64 letras e números).</li>
        <li>No Supabase, projeto <strong>controle-financeiro-mercado</strong>: Edge Functions → Secrets → <code>PSN_NPSSO</code> → editar, colar o código e salvar.</li>
        <li>Não clique em "Sair" no site da PlayStation (isso invalida o código).</li>
        <li>Volte aqui e toque em <strong>↻ Sincronizar</strong>. O aviso some quando der certo.</li>
      </ol>
      <p className="fraco">Nunca cole esse código em chat, e-mail ou arquivo: ele vale como a senha da sua conta.</p>
    </section>
  );
}
