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
    setEnviando(true)

    try {
      await login({ email: email.trim(), senha })
      navigate('/', { replace: true })
    } catch (falha) {
      if (falha.status === 403) {
        const destino = falha.email || email.trim()
        navigate(`/confirmar?email=${encodeURIComponent(destino)}`)
        return
      }
      setErro(falha.message || 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina">
      <h1>Entrar</h1>
      <p>Entre com o e-mail da sua conta, o que for: Gmail, Outlook ou outro.</p>

      <form className="formulario cartao" onSubmit={handleSubmit}>
        {erro ? <p className="alerta">{erro}</p> : null}

        <label className="campo">
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="email"
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
