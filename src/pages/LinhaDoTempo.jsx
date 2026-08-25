import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLinhaDoTempo } from '../services/dinosaurService'

const CORES = {
  Triássico: 'triassico',
  Jurássico: 'jurassico',
  Cretáceo: 'cretaceo',
}

export default function LinhaDoTempo() {
  const [periodos, setPeriodos] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    getLinhaDoTempo()
      .then((dados) => setPeriodos(dados.periodos || []))
      .catch((falha) =>
        setErro(falha.message || 'Não foi possível carregar a linha do tempo.'),
      )
  }, [])

  return (
    <section className="pagina">
      <h1>Linha do tempo</h1>
      <p>Os dinossauros organizados pelos três grandes períodos do Mesozoico.</p>
      {erro ? <p className="alerta">{erro}</p> : null}

      <div className="timeline pagina-timeline">
        {['Triássico', 'Jurássico', 'Cretáceo'].map((nome) => (
          <div key={nome} className={`timeline-item ${CORES[nome]}`}>
            <strong>{nome}</strong>
          </div>
        ))}
      </div>

      {periodos.map((periodo) => (
        <article key={periodo.nome} className="cartao" style={{ marginTop: 20 }}>
          <h2>{periodo.nome}</h2>
          {(periodo.dinossauros || []).length === 0 ? (
            <p>Nenhum dinossauro deste período ainda.</p>
          ) : (
            <ul>
              {(periodo.dinossauros || []).map((dino) => (
                <li key={dino.id}>
                  <Link to={`/dinossauros/${dino.id}`}>{dino.nome}</Link>
                  {' — '}
                  {dino.dieta}
                  {dino.autorNome ? (
                    <>
                      {' — feito por '}
                      {dino.usuarioId ? (
                        <Link to={`/usuarios/${dino.usuarioId}`}>{dino.autorNome}</Link>
                      ) : (
                        dino.autorNome
                      )}
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  )
}
