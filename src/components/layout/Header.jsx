import { NavLink, useNavigate } from 'react-router-dom'
import { urlFotoPerfil } from '../../constants/avatares'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/', label: 'Início', icon: 'casa' },
  { to: '/linha-do-tempo', label: 'Linha do Tempo', icon: 'globo' },
  { to: '/dinossauros', label: 'Dinossauros', icon: 'pegada' },
  { to: '/amigos', label: 'Amigos', icon: 'amigos' },
  { to: '/ranking', label: 'Ranking', icon: 'trofeu' },
  { to: '/sobre', label: 'Sobre', icon: 'info' },
  { to: '/contato', label: 'Contato', icon: 'carta' },
]

function Icone({ nome }) {
  if (nome === 'casa') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    )
  }
  if (nome === 'globo') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
      </svg>
    )
  }
  if (nome === 'pegada') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <ellipse cx="8" cy="7" rx="2" ry="3" />
        <ellipse cx="13" cy="6" rx="2" ry="3" />
        <ellipse cx="17.5" cy="9" rx="1.8" ry="2.6" />
        <path d="M7 14c3-1 8 0 10 3-4 3-10 2-12-1 0-1 1-2 2-2z" />
      </svg>
    )
  }
  if (nome === 'amigos') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M4 19c1-3.2 3.2-5 5-5s4 1.8 5 5" />
        <path d="M14.5 19c.4-2.2 1.6-3.4 2.7-3.4 1.2 0 2.4 1 2.8 3.4" />
      </svg>
    )
  }
  if (nome === 'info') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v7M12 7h.01" />
      </svg>
    )
  }
  if (nome === 'trofeu') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h8v3a4 4 0 0 1-8 0z" />
        <path d="M8 6H5a3 3 0 0 0 3 5M16 6h3a3 3 0 0 1-3 5" />
        <path d="M12 13v3M9 20h6M10 20v-4h4v4" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export default function Header() {
  const { autenticado, logout, usuario } = useAuth()
  const navigate = useNavigate()
  const fotoPerfil = urlFotoPerfil(usuario)

  return (
    <header className="cabecalho">
      <NavLink to="/" className="marca">
        <span className="marca-icone" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <path d="M10 38c8-2 14-12 22-12 3 0 6 2 10 2 6 0 10-6 16-4-4 6-8 8-14 8-4 0-6-2-10-2-6 0-10 6-16 10-4 2-8 0-8-2z" />
            <path d="M18 42c2 8 6 14 10 16-2-6-2-12 0-16" />
            <circle cx="46" cy="24" r="2.2" fill="#0b0b0b" stroke="none" />
          </svg>
        </span>
        <span>
          <strong>DINO PÉDIA</strong>
          <small>Descubra o mundo dos dinossauros</small>
        </span>
      </NavLink>

      <nav className="menu">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}>
            <Icone nome={link.icon} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="cabecalho-acoes">
        {autenticado ? (
          <>
            <NavLink to="/dinossauros/novo" className="botao">
              Adicionar
            </NavLink>
            <NavLink to="/perfil" className="botao botao-fantasma cabecalho-perfil">
              {fotoPerfil ? (
                <img className="cabecalho-avatar" src={fotoPerfil} alt="" />
              ) : null}
              Perfil
            </NavLink>
            <button
              type="button"
              className="botao"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="botao botao-fantasma">
              Entrar
            </NavLink>
            <NavLink to="/registrar" className="botao">
              Cadastrar
            </NavLink>
          </>
        )}
      </div>
    </header>
  )
}
