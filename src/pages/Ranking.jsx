import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { REGRAS_PONTOS } from '../constants'
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

export default function Ranking() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState([])
  const [regras, setRegras] = useState(REGRAS_PONTOS)
  const [niveis, setNiveis] = useState(NIVEIS_PADRAO)
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
                <span className={`ranking-pos ranking-pos-${pessoa.posicao}`}>
                  {pessoa.posicao}
                </span>
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
