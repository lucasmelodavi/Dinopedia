import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { configTipo } from '../constants'
import { getLinhaDoTempo } from '../services/dinosaurService'

const PERIODOS_META = [
  {
    nome: 'Triássico',
    slug: 'triassico',
    cor: 'triassico',
    anos: '252 – 201 M.A.',
    ordem: '01',
    resumo: 'Primeiros dinossauros e um mundo ainda se reorganizando após a grande extinção.',
  },
  {
    nome: 'Jurássico',
    slug: 'jurassico',
    cor: 'jurassico',
    anos: '201 – 145 M.A.',
    ordem: '02',
    resumo: 'Florestas luxuriantes, sauropodes gigantes e o auge dos predadores.',
  },
  {
    nome: 'Cretáceo',
    slug: 'cretaceo',
    cor: 'cretaceo',
    anos: '145 – 66 M.A.',
    ordem: '03',
    resumo: 'Diversidade máxima antes do impacto que encerrou a era dos dinossauros.',
  },
]

function metaPeriodo(nome) {
  return PERIODOS_META.find((item) => item.nome === nome) || PERIODOS_META[0]
}

function BadgeTipo({ tipo }) {
  const cfg = configTipo(tipo || 'dinossauro')
  return (
    <span className={`lt-badge lt-badge--${tipo || 'dinossauro'}`}>
      {cfg.simbolo} {cfg.nome}
    </span>
  )
}

function BadgeDieta({ dieta }) {
  const chave = String(dieta || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

  let mod = 'onivoro'
  if (chave.includes('carn')) mod = 'carnivoro'
  if (chave.includes('herb')) mod = 'herbivoro'

  return <span className={`lt-dieta lt-dieta--${mod}`}>{dieta}</span>
}

function FichaPeriodo({ periodo }) {
  const meta = metaPeriodo(periodo.nome)
  const lista = periodo.dinossauros || []
  const total = lista.length

  return (
    <section id={meta.slug} className={`lt-periodo lt-periodo--${meta.cor}`}>
      <header className="lt-periodo-cabecalho">
        <div className="lt-periodo-indice" aria-hidden="true">
          {meta.ordem}
        </div>
        <div className="lt-periodo-texto">
          <p className="lt-periodo-epoca">{meta.anos}</p>
          <h2>{periodo.nome}</h2>
          <p className="lt-periodo-resumo">{meta.resumo}</p>
        </div>
        <div className="lt-periodo-lateral">
          <span className="lt-contagem">
            {total} {total === 1 ? 'ficha' : 'fichas'}
          </span>
          <Link
            to={`/dinossauros?periodo=${encodeURIComponent(periodo.nome)}`}
            className="botao botao-fantasma lt-ver-todos"
          >
            Ver no catálogo
          </Link>
        </div>
      </header>

      {total === 0 ? (
        <div className="lt-vazio">
          <p>Nenhuma criatura deste período ainda.</p>
          <Link to="/dinossauros/novo" className="botao">
            Adicionar a primeira ficha
          </Link>
        </div>
      ) : (
        <div className="lt-grade">
          {lista.map((dino) => (
            <Link key={dino.id} to={`/dinossauros/${dino.id}`} className="lt-card">
              <div
                className="lt-card-foto"
                style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
              >
                <BadgeTipo tipo={dino.tipo} />
              </div>
              <div className="lt-card-corpo">
                <h3>{dino.nome}</h3>
                <p className="cientifico">{dino.nomeCientifico}</p>
                <BadgeDieta dieta={dino.dieta} />
                {dino.autorNome ? (
                  <p className="dino-autor">por {dino.autorNome}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default function LinhaDoTempo() {
  const [periodos, setPeriodos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    getLinhaDoTempo()
      .then((dados) => setPeriodos(dados.periodos || []))
      .catch((falha) =>
        setErro(falha.message || 'Não foi possível carregar a linha do tempo.'),
      )
      .finally(() => setCarregando(false))
  }, [])

  const contagemPorPeriodo = useMemo(() => {
    const mapa = {}
    periodos.forEach((periodo) => {
      mapa[periodo.nome] = (periodo.dinossauros || []).length
    })
    return mapa
  }, [periodos])

  const totalGeral = useMemo(
    () => Object.values(contagemPorPeriodo).reduce((soma, n) => soma + n, 0),
    [contagemPorPeriodo],
  )

  const periodosOrdenados = PERIODOS_META.map((meta) => {
    const dados = periodos.find((item) => item.nome === meta.nome)
    return dados || { nome: meta.nome, dinossauros: [] }
  })

  return (
    <section className="pagina linha-tempo-pagina">
      <header className="lt-hero">
        <p className="lt-hero-etiqueta">Mesozoico</p>
        <h1>Linha do tempo</h1>
        <p className="lt-hero-texto">
          Do Triássico ao Cretáceo: navegue pelos três grandes capítulos da história
          dos dinossauros e das criaturas do mesmo período.
        </p>
        {!carregando && !erro ? (
          <p className="lt-hero-stats">
            <strong>{totalGeral}</strong> {totalGeral === 1 ? 'ficha catalogada' : 'fichas catalogadas'}
          </p>
        ) : null}
      </header>

      <nav className="lt-faixa" aria-label="Períodos do Mesozoico">
        <div className="lt-faixa-trilho" aria-hidden="true" />
        {PERIODOS_META.map((meta, indice) => (
          <a key={meta.nome} href={`#${meta.slug}`} className={`lt-faixa-item lt-faixa-item--${meta.cor}`}>
            <span className="lt-faixa-ponto" />
            <strong>{meta.nome}</strong>
            <span className="lt-faixa-anos">{meta.anos}</span>
            {!carregando ? (
              <span className="lt-faixa-contagem">
                {contagemPorPeriodo[meta.nome] || 0} {contagemPorPeriodo[meta.nome] === 1 ? 'ficha' : 'fichas'}
              </span>
            ) : null}
            {indice < PERIODOS_META.length - 1 ? (
              <span className="lt-faixa-seta" aria-hidden="true">
                →
              </span>
            ) : null}
          </a>
        ))}
      </nav>

      {erro ? <p className="alerta">{erro}</p> : null}
      {carregando ? <p className="lt-carregando">Montando a linha do tempo...</p> : null}

      {!carregando && !erro
        ? periodosOrdenados.map((periodo) => (
            <FichaPeriodo key={periodo.nome} periodo={periodo} />
          ))
        : null}
    </section>
  )
}
