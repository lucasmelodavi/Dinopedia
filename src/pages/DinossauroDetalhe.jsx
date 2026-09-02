import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BotaoFavorito from '../components/BotaoFavorito'
import BotoesPronuncia from '../components/BotoesPronuncia'
import { configTipo } from '../constants'
import { useAuth } from '../context/AuthContext'
import { buscarDinossauro } from '../services/dinosaurService'

function BadgeTipo({ tipo }) {
  const cfg = configTipo(tipo || 'dinossauro')
  return (
    <span className={`badge-tipo badge-tipo--${tipo || 'dinossauro'}`}>
      {cfg.simbolo} {cfg.nome}
    </span>
  )
}

function CampoFicha({ rotulo, valor }) {
  if (!valor && valor !== 0) return null
  return (
    <p>
      <strong>{rotulo}:</strong> {valor}
    </p>
  )
}

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

  const cfg = configTipo(dino.tipo || 'dinossauro')
  const attrs = dino.atributos || {}

  return (
    <section className="pagina">
      <article className="ficha">
        <div
          className="ficha-foto"
          style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
        >
          <BotaoFavorito dinoId={dino.id} />
        </div>
        <div>
          <BadgeTipo tipo={dino.tipo} />
          <p className="cientifico">{dino.periodo}</p>
          <h1>{dino.nome}</h1>
          <p className="cientifico">{dino.nomeCientifico}</p>
          <BotoesPronuncia nome={dino.nome} nomeCientifico={dino.nomeCientifico} />
          <CampoFicha rotulo="Período" valor={dino.periodo} />
          <CampoFicha rotulo="Dieta" valor={dino.dieta} />
          <CampoFicha rotulo={cfg.rotuloGrupo} valor={dino.familia} />
          {dino.tipo === 'outro' ? (
            <CampoFicha rotulo="Tamanho" valor={attrs.tamanho} />
          ) : (
            <CampoFicha rotulo="Comprimento" valor={dino.comprimento ? `${dino.comprimento} m` : null} />
          )}
          {dino.tipo === 'pterossauro' ? (
            <>
              <CampoFicha rotulo="Envergura" valor={attrs.envergura ? `${attrs.envergura} m` : null} />
              <CampoFicha rotulo="Modo de voo" valor={attrs.modoVoo} />
            </>
          ) : null}
          {dino.tipo === 'reptil_marinho' ? (
            <CampoFicha rotulo="Habitat" valor={attrs.habitat} />
          ) : null}
          {dino.tipo === 'mamifero' ? (
            <>
              <CampoFicha rotulo="Peso" valor={attrs.peso ? `${attrs.peso} kg` : null} />
              <CampoFicha rotulo="Pelagem" valor={attrs.pelagem} />
            </>
          ) : null}
          <CampoFicha rotulo="Região" valor={dino.regiao} />
          <CampoFicha rotulo="Ano da descoberta" valor={dino.anoDescoberta} />
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
          <div className="ficha-acoes">
            <BotaoFavorito dinoId={dino.id} variante="linha" />
            {autenticado ? (
              <Link to={`/dinossauros/${dino.id}/editar`} className="botao botao-fantasma">
                Editar ficha e curiosidades
              </Link>
            ) : null}
          </div>
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
