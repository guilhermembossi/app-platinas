import { useIdioma } from '../i18n';

// Aviso de acesso à PSN vencido (tarefa 5.3), com o passo a passo para gerar um NPSSO novo.
// O código nunca passa pelo app: vai direto do site da Sony para o cofre do Supabase.
export default function AvisoToken() {
  const { t } = useIdioma();
  const a = t.token;
  return (
    <section className="cartao aviso-token" role="alert">
      <h2>{a.titulo}</h2>
      <p>{a.intro}</p>
      <ol>
        <li>{a.passo1[0]}<a href="https://www.playstation.com" target="_blank" rel="noopener noreferrer">playstation.com</a>{a.passo1[1]}</li>
        <li>{a.passo2[0]}<a href="https://ca.account.sony.com/api/v1/ssocookie" target="_blank" rel="noopener noreferrer">ca.account.sony.com/api/v1/ssocookie</a>{a.passo2[1]}</li>
        <li>{a.passo3[0]}<code>npsso</code>{a.passo3[1]}</li>
        <li>{a.passo4[0]}<strong>controle-financeiro-mercado</strong>{a.passo4[1]}<code>PSN_NPSSO</code>{a.passo4[2]}</li>
        <li>{a.passo5}</li>
        <li>{a.passo6[0]}<strong>{a.passo6[1]}</strong>{a.passo6[2]}</li>
      </ol>
      <p className="fraco">{a.cuidado}</p>
    </section>
  );
}
