import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErro('')
    const form = new FormData(evento.currentTarget)
    const emailInformado = String(form.get('email') || email).trim()
    const senhaInformada = String(form.get('senha') || senha)

    if (!emailInformado || !senhaInformada) {
      setErro('Preencha e-mail e senha.')
      return
    }

    setEnviando(true)

    try {
      await login({ email: emailInformado, senha: senhaInformada })
      navigate('/', { replace: true })
    } catch (falha) {
      if (falha.status === 403) {
        const destino = falha.email || emailInformado
        navigate(`/confirmar?email=${encodeURIComponent(destino)}`)
        return
      }
      if (falha.status === 404) {
        setErro('Não achamos uma conta com esse e-mail. Crie uma no cadastro.')
        return
      }
      setErro(falha.message || 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina pagina-auth">
      <h1>Entrar</h1>
      <p>Entre com o e-mail da sua conta, o que for: Gmail, Outlook ou outro.</p>

      <form className="formulario cartao" onSubmit={handleSubmit}>
        {erro ? (
          <p className="alerta">
            {erro}
            {erro.includes('cadastro') ? (
              <>
                {' '}
                <Link to="/registrar">Ir para o cadastro</Link>
              </>
            ) : null}
          </p>
        ) : null}

        <label className="campo">
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            enterKeyHint="next"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
        </label>

        <label className="campo">
          Senha
          <input
            type="password"
            name="senha"
            autoComplete="current-password"
            enterKeyHint="go"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
          />
        </label>

        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="form-links">
          Criar conta: <Link to="/registrar">cadastro</Link>
          {' · '}
          Código do Gmail: <Link to="/confirmar">confirmar e-mail</Link>
        </p>
      </form>
    </section>
  )
}
