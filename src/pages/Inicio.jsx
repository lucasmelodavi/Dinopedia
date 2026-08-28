import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BotaoFavorito from '../components/BotaoFavorito'
import MapaMundial from '../components/MapaMundial'
import { useAuth } from '../context/AuthContext'
import { pontosDasFichas } from '../constants/geocodigo'
import { listarDestaques, listarDinossauros, listarMapa } from '../services/dinosaurService'

const PERIODOS_VISUAL = [
  { nome: 'Triássico', anos: '252 - 201 M.A.', cor: 'triassico' },
  { nome: 'Jurássico', anos: '201 - 145 M.A.', cor: 'jurassico' },
  { nome: 'Cretáceo', anos: '145 - 66 M.A.', cor: 'cretaceo' },
]

export default function Inicio() {
  const { usuario } = useAuth()
  const [destaques, setDestaques] = useState([])
  const [pontosMapa, setPontosMapa] = useState([])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const [destaqueRes, listaRes, mapaRes] = await Promise.all([
          listarDestaques().catch(() => ({ data: [] })),
          listarDinossauros({ limit: 500, sort: 'id' }).catch(() => ({ data: [] })),
          listarMapa().catch(() => ({ data: [] })),
        ])
        if (!ativo) return

        const todas = listaRes.data || []
        const destaquesLista = destaqueRes.data?.length
          ? destaqueRes.data
          : todas.slice(0, 8)
        setDestaques(destaquesLista.slice(0, 4))
        setPontosMapa(pontosDasFichas(todas, mapaRes.data || []))
      } catch {
        if (ativo) {
          setDestaques([])
          setPontosMapa([])
        }
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-foto">
          <img className="hero-trex" src="/hero-trex.png?v=2" alt="Tiranossauro rex" />
        </div>
        <div className="hero-sombra" />

        <div className="hero-texto">
          <h1>
            Explore a <span>era dos dinossauros</span>
          </h1>
          <p>
            Navegue pela linha do tempo, descubra espécies e ajude a construir
            a enciclopédia colaborativa da DinoPédia.
          </p>
          <Link to="/linha-do-tempo" className="botao botao-hero">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            Explorar linha do tempo
          </Link>

          <div className="timeline">
            {PERIODOS_VISUAL.map((periodo) => (
              <Link
                key={periodo.nome}
                to={`/dinossauros?periodo=${encodeURIComponent(periodo.nome)}`}
                className={`timeline-item ${periodo.cor}`}
              >
                <strong>{periodo.nome}</strong>
                <span>{periodo.anos}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="destaques">
        <h2>
          <span className="destaques-icone" aria-hidden="true" />
          Dinossauros em destaque
        </h2>
        <div className="grade-dinos">
          {destaques.map((dino) => (
            <article key={dino.id} className={`card-dino ${Number(usuario?.favoritoId) === Number(dino.id) || Number(usuario?.favorito?.id) === Number(dino.id) ? 'is-favorito' : ''}`}>
              <div
                className="card-dino-foto"
                style={
                  dino.fotoUrl
                    ? { backgroundImage: `url(${dino.fotoUrl})` }
                    : undefined
                }
              >
                <BotaoFavorito dinoId={dino.id} />
              </div>
              <div className="card-dino-corpo">
                <h3>{dino.nome}</h3>
                <p className="cientifico">{dino.nomeCientifico}</p>
                <p>Período: {dino.periodo}</p>
                <p>Dieta: {dino.dieta}</p>
                {dino.autorNome ? (
                  <p className="dino-autor">
                    Feito por{' '}
                    {dino.usuarioId ? (
                      <Link to={`/usuarios/${dino.usuarioId}`}>{dino.autorNome}</Link>
                    ) : (
                      dino.autorNome
                    )}
                  </p>
                ) : null}
                <Link to={`/dinossauros/${dino.id}`} className="botao botao-fantasma">
                  Ver detalhes
                </Link>
              </div>
            </article>
          ))}
        </div>
        {destaques.length === 0 ? (
          <p>Nenhum destaque ainda. Suba o backend para carregar a lista.</p>
        ) : null}
        <div className="destaques-acao">
          <a href="#mapa" className="botao">
            Ver mapa-múndi
          </a>
          <Link to="/dinossauros" className="botao botao-fantasma">
            Ver todos os dinossauros
          </Link>
        </div>
      </section>
      <MapaMundial pontos={pontosMapa} />
    </div>
  )
}
