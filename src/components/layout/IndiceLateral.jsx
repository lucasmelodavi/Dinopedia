import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const CURIOSIDADES = [
  'O Tricerátopo tinha um crânio de até 2,5 metros.',
  'O Tiranossauro rex via melhor que muita ave de rapina.',
  'Alguns saurópodes podiam chegar a mais de 30 metros.',
]

function destinoDoLink(to) {
  if (typeof to !== 'string' || !to.includes('#')) return to
  const [pathname, hash] = to.split('#')
  return { pathname, hash: `#${hash}` }
}

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
  if (nome === 'mais') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }
  if (nome === 'topico') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14M5 12h10M5 18h12" />
      </svg>
    )
  }
  if (nome === 'edicao') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4l10-10-4-4L4 16z" />
        <path d="m14 6 4 4" />
      </svg>
    )
  }
  if (nome === 'pessoa') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
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
  if (nome === 'trofeu') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h8v3a4 4 0 0 1-8 0z" />
        <path d="M8 6H5a3 3 0 0 0 3 5M16 6h3a3 3 0 0 1-3 5" />
        <path d="M12 13v3M9 20h6M10 20v-4h4v4" />
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
  if (nome === 'carta') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    )
  }
  if (nome === 'sair') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" />
        <path d="M10 12h11M17 8l4 4-4 4" />
      </svg>
    )
  }
  if (nome === 'engrenagem') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6 7.8 7.8M16.2 16.2l2.2 2.2M18.4 5.6 16.2 7.8M7.8 16.2 5.6 18.4" />
      </svg>
    )
  }
  if (nome === 'estrela') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 14.4 9l6 .5-4.6 3.8 1.6 5.7L12 16.2 6.6 19l1.6-5.7L3.6 9.5l6-.5z" />
      </svg>
    )
  }
  if (nome === 'coracao') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.4-9-9c-1.3-3 1-6.5 4.2-6.5 2 0 3.4 1.2 4.8 3 1.4-1.8 2.8-3 4.8-3 3.2 0 5.5 3.5 4.2 6.5-2 4.6-9 9-9 9z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6h9M8 12h9M8 18h9M5 6h.01M5 12h.01M5 18h.01" />
    </svg>
  )
}

export default function IndiceLateral({ aberto, onMudar }) {
  const { autenticado, logout, usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [hoverDesktop, setHoverDesktop] = useState(false)
  const navegacaoInicial = useRef(true)
  const curiosidade = CURIOSIDADES[(usuario?.id || 0) % CURIOSIDADES.length]
  const visivel = aberto || hoverDesktop

  const principais = [
    { to: '/', label: 'Início', icon: 'casa', fim: true },
    { to: '/#mapa', label: 'Mapa', icon: 'globo' },
    { to: '/linha-do-tempo', label: 'Linha do Tempo', icon: 'globo' },
    { to: '/dinossauros', label: 'Dinossauros', icon: 'pegada' },
  ]

  const conta = autenticado
    ? [
        { to: '/dinossauros/novo', label: 'Adicionar dinossauro', icon: 'mais' },
        { to: '/perfil#favorito', label: 'Favorito', icon: 'coracao' },
        { to: '/perfil#conquistas', label: 'Conquistas', icon: 'trofeu' },
        { to: '/perfil#enfeites', label: 'Enfeites', icon: 'estrela', ativo: false },
        { to: '/perfil#meus-topicos', label: 'Meus tópicos', icon: 'topico', ativo: false },
        { to: '/perfil#edicoes', label: 'Minhas edições', icon: 'edicao', ativo: false },
        { to: '/perfil', label: 'Perfil', icon: 'pessoa' },
        { to: '/amigos', label: 'Amigos', icon: 'amigos' },
        { to: '/ranking', label: 'Ranking', icon: 'trofeu' },
      ]
    : [
        { to: '/amigos', label: 'Amigos', icon: 'amigos' },
        { to: '/ranking', label: 'Ranking', icon: 'trofeu' },
        { to: '/login', label: 'Entrar', icon: 'pessoa' },
        { to: '/registrar', label: 'Cadastrar', icon: 'mais' },
      ]

  const extra = [
    { to: '/sobre', label: 'Sobre', icon: 'info' },
    { to: '/contato', label: 'Contato', icon: 'carta' },
  ]

  function fechar() {
    onMudar(false)
    setHoverDesktop(false)
  }

  function ehDesktop() {
    return window.matchMedia('(hover: hover) and (min-width: 861px)').matches
  }

  function classeLink(link) {
    return ({ isActive }) => {
      if (link.ativo === false) return undefined
      return isActive ? 'active' : undefined
    }
  }

  useEffect(() => {
    if (navegacaoInicial.current) {
      navegacaoInicial.current = false
      return
    }
    onMudar(false)
    setHoverDesktop(false)
  }, [location.pathname, location.hash, onMudar])

  useEffect(() => {
    function aoRedimensionar() {
      if (window.innerWidth > 860) onMudar(false)
    }
    window.addEventListener('resize', aoRedimensionar)
    return () => window.removeEventListener('resize', aoRedimensionar)
  }, [onMudar])

  useEffect(() => {
    if (!aberto) return undefined

    function noEscape(evento) {
      if (evento.key === 'Escape') onMudar(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', noEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', noEscape)
    }
  }, [aberto, onMudar])

  return (
    <>
      {aberto ? (
        <button type="button" className="indice-fundo" aria-label="Fechar índice" onClick={fechar} />
      ) : null}

      <div
        className={`indice-envolve ${visivel ? 'is-aberto' : ''}`}
        onMouseEnter={() => {
          if (ehDesktop()) setHoverDesktop(true)
        }}
        onMouseLeave={() => {
          if (ehDesktop()) setHoverDesktop(false)
        }}
      >
        <button
          type="button"
          className="indice-zona"
          aria-label="Abrir índice de páginas"
          aria-expanded={visivel}
          onClick={() => onMudar(!aberto)}
        />

        <aside className="indice-lateral" aria-label="Índice do site">
          <div className="indice-topo">
            <p className="indice-titulo">Índice</p>
            <button type="button" className="indice-fechar" aria-label="Fechar índice" onClick={fechar}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <nav>
            {principais.map((link) => (
              <NavLink key={link.to} to={destinoDoLink(link.to)} end={link.fim} className={classeLink(link)} onClick={fechar}>
                <Icone nome={link.icon} />
                {link.label}
              </NavLink>
            ))}
            {conta.map((link) => (
              <NavLink key={`${link.to}-${link.label}`} to={destinoDoLink(link.to)} className={classeLink(link)} onClick={fechar}>
                <Icone nome={link.icon} />
                {link.label}
              </NavLink>
            ))}
            <span className="indice-separador" />
            {autenticado ? (
              <NavLink
                to={destinoDoLink('/perfil#configuracoes')}
                className={classeLink({ ativo: false })}
                onClick={fechar}
              >
                <Icone nome="engrenagem" />
                Configurações
              </NavLink>
            ) : null}
            {extra.map((link) => (
              <NavLink key={link.to} to={destinoDoLink(link.to)} className={classeLink(link)} onClick={fechar}>
                <Icone nome={link.icon} />
                {link.label}
              </NavLink>
            ))}
            {autenticado ? (
              <button
                type="button"
                className="indice-sair"
                onClick={() => {
                  logout()
                  fechar()
                  navigate('/')
                }}
              >
                <Icone nome="sair" />
                Sair
              </button>
            ) : null}
          </nav>

          <article className="indice-curiosidade">
            <strong>Você sabia?</strong>
            <p>{curiosidade}</p>
            <NavLink to="/dinossauros" onClick={fechar}>
              Ver mais curiosidades
            </NavLink>
          </article>
        </aside>
      </div>
    </>
  )
}
