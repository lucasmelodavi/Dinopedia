import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { atualizarFavorito } from '../services/authService'

export default function BotaoFavorito({ dinoId, className = '' }) {
  const { autenticado, usuario, atualizarUsuario } = useAuth()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  if (!autenticado) return null

  const ativo =
    Number(usuario?.favoritoId) === Number(dinoId) ||
    Number(usuario?.favorito?.id) === Number(dinoId)

  async function marcar(evento) {
    evento.preventDefault()
    evento.stopPropagation()
    if (salvando) return
    setErro('')
    setSalvando(true)
    try {
      const dados = await atualizarFavorito(ativo ? null : Number(dinoId))
      atualizarUsuario(dados)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar o favorito.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <span className={`favorito-acao ${className}`.trim()}>
      <button
        type="button"
        className={`botao botao-favorito ${ativo ? 'is-ativo' : 'botao-fantasma'}`}
        onClick={marcar}
        disabled={salvando}
        aria-pressed={ativo}
      >
        {salvando ? 'Salvando...' : ativo ? 'Favorito' : 'Marcar como favorito'}
      </button>
      {erro ? <small className="alerta">{erro}</small> : null}
    </span>
  )
}
