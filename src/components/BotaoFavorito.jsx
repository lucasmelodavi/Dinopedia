import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { atualizarFavorito } from '../services/authService'

function Coracao({ preenchido }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-9-9c-1.3-3 1-6.5 4.2-6.5 2 0 3.4 1.2 4.8 3 1.4-1.8 2.8-3 4.8-3 3.2 0 5.5 3.5 4.2 6.5-2 4.6-9 9-9 9z"
        fill={preenchido ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function BotaoFavorito({ dinoId, className = '', variante = 'foto' }) {
  const navigate = useNavigate()
  const { autenticado, usuario, atualizarUsuario } = useAuth()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [estouro, setEstouro] = useState(false)

  const ativo =
    Number(usuario?.favoritoId) === Number(dinoId) ||
    Number(usuario?.favorito?.id) === Number(dinoId)

  async function marcar(evento) {
    evento.preventDefault()
    evento.stopPropagation()
    if (!autenticado) {
      navigate('/login')
      return
    }
    if (salvando) return

    const proximoId = ativo ? null : Number(dinoId)
    const anterior = usuario
    setErro('')
    setSalvando(true)
    if (proximoId) {
      setEstouro(true)
      window.setTimeout(() => setEstouro(false), 380)
    }
    atualizarUsuario({
      favoritoId: proximoId,
      favorito:
        proximoId && Number(usuario?.favorito?.id) === Number(proximoId)
          ? usuario.favorito
          : null,
    })

    try {
      const dados = await atualizarFavorito(proximoId)
      atualizarUsuario(dados)
    } catch (falha) {
      atualizarUsuario(anterior)
      setErro(falha.message || 'Não foi possível curtir agora.')
    } finally {
      setSalvando(false)
    }
  }

  const rotulo = ativo ? 'Curtido' : 'Curtir'

  return (
    <span className={`curtir-wrap curtir-wrap--${variante} ${className}`.trim()}>
      <button
        type="button"
        className={`curtir-favorito ${ativo ? 'is-ativo' : ''} ${estouro ? 'is-estouro' : ''}`}
        onClick={marcar}
        disabled={salvando}
        aria-pressed={ativo}
        aria-label={rotulo}
        title={rotulo}
      >
        <Coracao preenchido={ativo} />
        {variante === 'linha' ? <span>{salvando ? '...' : rotulo}</span> : null}
      </button>
      {erro && variante === 'linha' ? <small className="alerta">{erro}</small> : null}
    </span>
  )
}
