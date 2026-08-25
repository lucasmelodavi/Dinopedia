import { useState } from 'react'
import { Link } from 'react-router-dom'
import { REGRAS_PONTOS } from '../../constants'
import { useAuth } from '../../context/AuthContext'

export default function PainelPontos() {
  const { autenticado, usuario } = useAuth()
  const [aberto, setAberto] = useState(false)

  if (!autenticado) return null

  const pontos = usuario?.pontos || 0
  const nivel = usuario?.nivel

  return (
    <aside
      className={`painel-pontos ${aberto ? 'is-aberto' : ''}`}
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <button
        type="button"
        className="painel-pontos-aba"
        aria-expanded={aberto}
        aria-controls="caixa-pontos"
        onClick={() => setAberto((valor) => !valor)}
      >
        <span>{pontos}</span>
        <small>pts</small>
      </button>

      <div id="caixa-pontos" className="painel-pontos-caixa">
        <p className="painel-pontos-total">{pontos} pts</p>
        <strong>{nivel?.nome || 'Recruta'}</strong>
        {nivel?.proximo ? (
          <p>Faltam {nivel.faltam} para {nivel.proximo.nome}.</p>
        ) : (
          <p>Você chegou no nível máximo.</p>
        )}
        <p className="painel-pontos-titulo">Como ganhar</p>
        <ul>
          {REGRAS_PONTOS.map((regra) => (
            <li key={regra.label}>
              <span>+{regra.pontos}</span>
              {regra.label}
            </li>
          ))}
        </ul>
        <Link to="/ranking" className="botao" onClick={() => setAberto(false)}>
          Ver ranking
        </Link>
        <Link to="/perfil" className="botao botao-fantasma" onClick={() => setAberto(false)}>
          Completar perfil
        </Link>
      </div>
    </aside>
  )
}
