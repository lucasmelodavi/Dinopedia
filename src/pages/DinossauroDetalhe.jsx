import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { buscarDinossauro } from '../services/dinosaurService'

export default function DinossauroDetalhe() {
  const { id } = useParams()
  const { autenticado } = useAuth()
  const [dino, setDino] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarDinossauro(id)
      .then(setDino)
      .catch((falha) => setErro(falha.message || 'Não foi possível abrir a ficha.'))
  }, [id])

  if (erro) {
    return (
      <section className="pagina">
        <p className="alerta">{erro}</p>
        <Link to="/dinossauros">Voltar ao catálogo</Link>
      </section>
    )
  }

  if (!dino) {
    return (
      <section className="pagina">
        <p>Carregando ficha...</p>
      </section>
    )
  }

  return (
    <section className="pagina">
      <article className="ficha">
        <div
          className="ficha-foto"
          style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
        />
        <div>
          <p className="cientifico">{dino.periodo}</p>
          <h1>{dino.nome}</h1>
          <p className="cientifico">{dino.nomeCientifico}</p>
          <p>Período: {dino.periodo}</p>
          <p>Dieta: {dino.dieta}</p>
          {dino.familia ? <p>Família: {dino.familia}</p> : null}
          {dino.comprimento ? <p>Comprimento: {dino.comprimento} m</p> : null}
          {dino.regiao ? <p>Região: {dino.regiao}</p> : null}
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
          <p>{dino.descricao}</p>
          {autenticado ? (
            <Link to={`/dinossauros/${dino.id}/editar`} className="botao botao-fantasma">
              Editar ficha e curiosidades
            </Link>
          ) : null}
        </div>
      </article>

      {(dino.topicos || []).length > 0 ? (
        <div className="grade" id="topicos" style={{ marginTop: 28 }}>
          {dino.topicos.map((topico) => (
            <article key={topico.id} className="cartao">
              <h2>{topico.categoria}</h2>
              <p>{topico.texto}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
