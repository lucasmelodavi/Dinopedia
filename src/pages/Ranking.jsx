import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { REGRAS_PONTOS } from '../constants'
import { catalogoConquistas } from '../constants/conquistas'
import { useAuth } from '../context/AuthContext'
import { listarRanking } from '../services/userService'

const NIVEIS_PADRAO = [
  { nome: 'Recruta', min: 0 },
  { nome: 'Explorador', min: 50 },
  { nome: 'Paleontólogo', min: 150 },
  { nome: 'Curador', min: 400 },
  { nome: 'Lenda do Mesozoico', min: 1000 },
  { nome: 'Lendário', min: 5000 },
]

function SimboloPosicao({ posicao }) {
  const lugar = Number(posicao) || 0
  const titulo = `${lugar}º lugar`

  if (lugar === 1) {
    return (
      <span className="ranking-pos ranking-pos-1" title={titulo} aria-label={titulo}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 9 8 5l4 4 4-4 3 4v2c0 4.5-3.2 7.2-7 8.5-3.8-1.3-7-4-7-8.5z" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      </span>
    )
  }

  if (lugar === 2) {
    return (
      <span className="ranking-pos ranking-pos-2" title={titulo} aria-label={titulo}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="13" r="6.5" />
          <path d="M9 4h6l-1.2 5H10.2z" />
        </svg>
      </span>
    )
  }

  if (lugar === 3) {
    return (
      <span className="ranking-pos ranking-pos-3" title={titulo} aria-label={titulo}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="13" r="6.5" />
          <path d="M8 3.5 12 8l4-4.5" />
        </svg>
      </span>
    )
  }

  return (
    <span className="ranking-pos ranking-pos-resto" title={titulo} aria-label={titulo}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <ellipse cx="8" cy="7" rx="1.7" ry="2.5" />
        <ellipse cx="12.5" cy="6.2" rx="1.7" ry="2.5" />
        <ellipse cx="16.4" cy="8.4" rx="1.5" ry="2.2" />
        <path d="M7 14c3-1 8 0 10 3-4 3-10 2-12-1 0-1 1-2 2-2z" />
      </svg>
      <small>{lugar}</small>
    </span>
  )
}

export default function Ranking() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState([])
  const [regras, setRegras] = useState(REGRAS_PONTOS)
  const [niveis, setNiveis] = useState(NIVEIS_PADRAO)
  const [conquistas, setConquistas] = useState(catalogoConquistas)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    listarRanking(30)
      .then((dados) => {
        setLista(dados.data || [])
        if (Array.isArray(dados.regras) && dados.regras.length) {
          setRegras(dados.regras)
        }
        if (Array.isArray(dados.niveis) && dados.niveis.length) {
          setNiveis(dados.niveis)
        }
        setConquistas(
          Array.isArray(dados.conquistas) && dados.conquistas.length
            ? dados.conquistas
            : catalogoConquistas(),
        )
      })
      .catch((falha) => setErro(falha.message || 'Não foi possível abrir o ranking.'))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <section className="pagina pagina-perfil">
      <h1>Ranking de pontos</h1>
      <p>
        Contribua com fichas, complete o perfil (foto e descrição) e suba de
        nível. Quem mais ajuda a DinoPédia aparece aqui.
      </p>

      {erro ? <p className="alerta">{erro}</p> : null}

      <article className="perfil-cartao">
        <div className="perfil-cartao-topo">
          <h2>Como ganhar pontos</h2>
        </div>
        <ul className="lista-regras-pontos">
          {regras.map((regra) => (
            <li key={regra.tipo || regra.label}>
              <strong>+{regra.pontos}</strong>
              <span>{regra.label}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="perfil-cartao">
        <div className="perfil-cartao-topo">
          <h2>Níveis</h2>
        </div>
        <p className="perfil-cartao-legenda">
          Dá para passar de 5.000 pontos; o nível máximo continua sendo Lendário.
        </p>
        <ul className="lista-regras-pontos">
          {niveis.map((nivel) => (
            <li key={nivel.nome}>
              <strong>{nivel.min}+</strong>
              <span>{nivel.nome}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="perfil-cartao">
        <div className="perfil-cartao-topo">
          <h2>Conquistas</h2>
        </div>
        <p className="perfil-cartao-legenda">
          Aparecem no perfil quando a pessoa faz cada marca. Não dão pontos extras.
        </p>
        <ul className="lista-regras-pontos">
          {conquistas.map((conquista) => (
            <li key={conquista.id}>
              <strong>{conquista.simbolo}</strong>
              <span>
                {conquista.nome} — {conquista.descricao}
              </span>
            </li>
          ))}
        </ul>
      </article>

      <article className="perfil-cartao">
        <div className="perfil-cartao-topo">
          <h2>Colaboradores</h2>
          <span>{carregando ? 'Carregando...' : `${lista.length} pessoa(s)`}</span>
        </div>
        {lista.length === 0 && !carregando ? (
          <p>Ainda não há pontuação. Cadastre um dinossauro para começar.</p>
        ) : (
          <ol className="lista-ranking">
            {lista.map((pessoa) => (
              <li
                key={pessoa.id}
                className={`item-ranking ${pessoa.id === usuario?.id ? 'is-eu' : ''}`}
              >
                <SimboloPosicao posicao={pessoa.posicao} />
                <Link to={`/usuarios/${pessoa.id}`} className="ranking-pessoa">
                  <Avatar usuario={pessoa} className="lista-pessoa-foto" />
                  <span>
                    <strong>{pessoa.nome}</strong>
                    <small>{pessoa.nivel?.nome || 'Recruta'}</small>
                  </span>
                </Link>
                <strong className="ranking-pts">{pessoa.pontos || 0} pts</strong>
              </li>
            ))}
          </ol>
        )}
      </article>
    </section>
  )
}
