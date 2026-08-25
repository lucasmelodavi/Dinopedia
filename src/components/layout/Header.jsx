import { NavLink, useNavigate } from 'react-router-dom'
import { urlFotoPerfil } from '../../constants/avatares'
import { useAuth } from '../../context/AuthContext'

export default function Header({ onAbrirIndice, indiceAberto }) {
  const { autenticado, logout, usuario } = useAuth()
  const navigate = useNavigate()
  const fotoPerfil = urlFotoPerfil(usuario)

  return (
    <header className="cabecalho">
      <button
        type="button"
        className="botao-menu"
        aria-label={indiceAberto ? 'Fechar índice' : 'Abrir índice'}
        aria-expanded={indiceAberto}
        onClick={onAbrirIndice}
      >
        <span />
        <span />
        <span />
      </button>

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

      <div className="cabecalho-acoes">
        {autenticado ? (
          <>
            <NavLink to="/dinossauros/novo" className="botao cabecalho-acao-extra">
              Adicionar
            </NavLink>
            <NavLink to="/perfil" className="botao botao-fantasma cabecalho-perfil">
              {fotoPerfil ? (
                <img className="cabecalho-avatar" src={fotoPerfil} alt="" />
              ) : (
                <span className="cabecalho-avatar cabecalho-avatar-vazio" aria-hidden="true" />
              )}
              <span className="cabecalho-perfil-texto">Perfil</span>
            </NavLink>
            <button
              type="button"
              className="botao cabecalho-acao-extra"
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
            <NavLink to="/registrar" className="botao cabecalho-acao-extra">
              Cadastrar
            </NavLink>
          </>
        )}
      </div>
    </header>
  )
}
