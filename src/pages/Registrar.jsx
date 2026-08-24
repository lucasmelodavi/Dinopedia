import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrar } from '../services/authService'

export default function Registrar() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      const dados = await registrar({ nome: nome.trim(), email: email.trim(), senha })
      const emailCriado = dados.email || email.trim()
      const nomeCriado = dados.nome || nome.trim()
      navigate(`/confirmar?email=${encodeURIComponent(emailCriado)}`, {
        state: {
          email: emailCriado,
          nome: nomeCriado,
          emailEnviado: dados.emailEnviado,
          emailErro: dados.emailErro,
          codigo: dados.emailEnviado ? undefined : dados.codigo,
          mensagem: dados.mensagem,
        },
      })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível criar a conta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pagina">
      <h1>Criar conta</h1>
      <p>
        A pessoa coloca o e-mail dela. Se o Gmail não chegar, o código aparece
        na próxima tela.
      </p>

      <form className="formulario cartao" onSubmit={handleSubmit}>
        {erro ? <p className="alerta">{erro}</p> : null}

        <label className="campo">
          Nome
          <input
            type="text"
            name="nome"
            autoComplete="name"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
          />
        </label>

        <label className="campo">
          Gmail da pessoa
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="ex: maria@gmail.com"
            required
          />
        </label>

        <label className="campo">
          Senha
          <input
            type="password"
            name="senha"
            autoComplete="new-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            minLength={6}
            required
          />
        </label>

        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Criando... aguarde uns segundos' : 'Criar conta'}
        </button>

        <p className="form-links">
          Já tem conta? <Link to="/login">Entrar</Link>
          {' · '}
          Já recebeu o código? <Link to="/confirmar">Confirmar e-mail</Link>
        </p>
      </form>
    </section>
  )
}
