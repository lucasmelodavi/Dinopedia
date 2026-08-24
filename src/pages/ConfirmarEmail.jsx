import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { confirmarEmail, reenviarCodigo } from '../services/authService'

export default function ConfirmarEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { entrarComSessao } = useAuth()
  const [searchParams] = useSearchParams()

  const emailInicial = location.state?.email || searchParams.get('email') || ''
  const nomeInicial = location.state?.nome || searchParams.get('nome') || ''
  const codigoGerado = location.state?.codigo || ''
  const emailSaiuNoCadastro = location.state?.emailEnviado

  const [email, setEmail] = useState(emailInicial)
  const [nome, setNome] = useState(nomeInicial)
  const [codigo, setCodigo] = useState(codigoGerado)
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [erro, setErro] = useState(
    emailSaiuNoCadastro === false
      ? 'O e-mail não saiu. Use o código que aparece abaixo.'
      : '',
  )
  const [aviso, setAviso] = useState(
    emailSaiuNoCadastro === false && codigoGerado
      ? `O Gmail ainda não enviou. Use este código: ${codigoGerado}`
      : emailSaiuNoCadastro === true
        ? `Enviamos o código para ${emailInicial}. Abra o Gmail e olhe também o Spam.`
        : location.state?.mensagem || '',
  )

  const primeiroNome = (nome || 'DinoUsuário').trim().split(' ')[0]
  const codigoLimpo = useMemo(() => codigo.replace(/\D/g, '').slice(0, 6), [codigo])

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErro('')

    if (!email.trim() || codigoLimpo.length !== 6) {
      setErro('Preencha o e-mail e o código de 6 dígitos.')
      return
    }

    setEnviando(true)
    try {
      const dados = await confirmarEmail({
        email: email.trim(),
        codigo: codigoLimpo,
      })
      entrarComSessao({ token: dados.token, usuario: dados.usuario })
      navigate('/', { replace: true })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível confirmar o e-mail.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleReenviar() {
    setErro('')
    if (!email.trim()) {
      setErro('Informe o e-mail para reenviar o código.')
      return
    }

    setReenviando(true)
    try {
      const dados = await reenviarCodigo({ email: email.trim() })
      if (dados.nome) setNome(dados.nome)
      if (dados.emailEnviado === false) {
        setErro(
          dados.emailErro ||
            'O e-mail não saiu. Use o código da tela.',
        )
        if (dados.codigo) {
          setCodigo(dados.codigo)
          setAviso(`O e-mail não saiu. Use este código: ${dados.codigo}`)
        }
        return
      }
      setCodigo('')
      setAviso(`Novo código enviado para ${email.trim()}. Abra o Gmail e cole aqui.`)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível reenviar o código.')
    } finally {
      setReenviando(false)
    }
  }

  return (
    <section className="pagina">
      <h1>Olá, {primeiroNome}</h1>
      <p>
        O código vai para o e-mail da conta que você criou
        {email ? ` (${email})` : ''}. Pode ser Gmail, Outlook ou outro.
      </p>

      <article className="gmail-carta">
        <header className="gmail-carta-topo">
          <img src="/email/logo-trex.png" alt="" width="56" height="56" />
          <p className="gmail-marca">DINO PÉDIA</p>
          <p className="gmail-slogan">Descubra. Aprenda. Compartilhe.</p>
        </header>
        <p className="gmail-assunto">Seu código de verificação do DinoPédia</p>
        <p className="gmail-meta">De: DinoPédia · Para: {email || 'seu e-mail'}</p>
        <p>
          Olá, <strong>{primeiroNome}</strong>! Se o e-mail não chegar, use o
          código que aparece nesta tela. Ele vale por 10 minutos.
        </p>
        {codigoLimpo.length === 6 ? (
          <p className="codigo-grande">{codigoLimpo}</p>
        ) : null}
        <p className="gmail-seguranca">
          <img src="/email/escudo.png" alt="" width="28" height="28" />
          Segurança em primeiro lugar. Se você não pediu este código, ignore o
          e-mail.
        </p>
      </article>

      <form className="formulario cartao" onSubmit={handleSubmit}>
        {aviso ? <p className="aviso">{aviso}</p> : null}
        {erro ? <p className="alerta">{erro}</p> : null}

        <label className="campo">
          E-mail da conta
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="seuemail@gmail.com"
            required
          />
        </label>

        <label className="campo">
          Código pessoal de 6 dígitos
          <input
            className="codigo-input"
            type="text"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigoLimpo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="000000"
            required
          />
        </label>

        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Confirmando...' : `Confirmar conta de ${primeiroNome}`}
        </button>

        <button
          className="botao botao-secundario"
          type="button"
          onClick={handleReenviar}
          disabled={reenviando}
        >
          {reenviando ? 'Reenviando...' : 'Reenviar e-mail pessoal'}
        </button>

        <p className="form-links">
          Ainda não tem conta? <Link to="/registrar">Criar conta</Link>
          {' · '}
          Já confirmou? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </section>
  )
}
