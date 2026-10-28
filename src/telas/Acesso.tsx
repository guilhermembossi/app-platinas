import { useState, type FormEvent } from 'react';
import { marca } from '../config/marca';
import { mensagemDeErro, supabase } from '../supabase';
import Logo from '../componentes/Logo';

// Tela de quem ainda não entrou. Só "Entrar": o cadastro está fechado e o único usuário
// foi criado no painel do Supabase (tarefa 1.3).
export default function Acesso() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) throw error;
    } catch (err) {
      setErro(mensagemDeErro(err as Error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="acesso">
      <div className="acesso-marca">
        <Logo tamanho={72} />
        <p className="acesso-nome">{marca.nome}</p>
      </div>

      <form className="cartao formulario" onSubmit={enviar}>
        <h1>Entrar</h1>
        <label>E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" inputMode="email" autoCapitalize="none" required />
        </label>
        <label>Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password" required />
        </label>

        {erro && <p className="mensagem erro" role="alert">{erro}</p>}

        <button className="botao-primario" type="submit" disabled={enviando}>
          {enviando ? 'Aguarde…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
