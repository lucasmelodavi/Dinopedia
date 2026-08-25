import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { REGRAS_PONTOS } from '../constants'
import { useAuth } from '../context/AuthContext'
import { listarRanking } from '../services/userService'

export default function Ranking() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState([])
  const [regras, setRegras] = useState(REGRAS_PONTOS)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    listarRanking(30)
      .then((dados) => {
        setLista(dados.data || [])
        if (Array.isArray(dados.regras) && dados.regras.length) {
          setRegras(dados.regras)
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
