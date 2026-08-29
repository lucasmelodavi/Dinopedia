import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BotaoFavorito from '../components/BotaoFavorito'
import { DIETAS, PERIODOS_TODOS, TIPOS_CRIATURA, configTipo } from '../constants'
import { useAuth } from '../context/AuthContext'
import { listarDinossauros } from '../services/dinosaurService'

const FILTROS_VAZIOS = {
  nome: '',
  tipo: '',
  periodo: '',
  dieta: '',
  familia: '',
}

function BadgeTipo({ tipo }) {
  const cfg = configTipo(tipo || 'dinossauro')
  return (
    <span className={`badge-tipo badge-tipo--${tipo || 'dinossauro'}`}>
      {cfg.simbolo} {cfg.nome}
    </span>
  )
}

export default function Catalogo() {
  const { usuario } = useAuth()
  const [searchParams] = useSearchParams()
  const periodoUrl = searchParams.get('periodo') || ''
  const [filtros, setFiltros] = useState({ ...FILTROS_VAZIOS, periodo: periodoUrl })
  const [busca, setBusca] = useState({ ...FILTROS_VAZIOS, periodo: periodoUrl })
  const [dinossauros, setDinossauros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const periodo = searchParams.get('periodo') || ''
    setFiltros((atual) => ({ ...atual, periodo }))
    setBusca((atual) => ({ ...atual, periodo }))
  }, [searchParams])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const params = { ...busca }
        if (!params.tipo) delete params.tipo
        if (!params.periodo) delete params.periodo
        if (!params.dieta) delete params.dieta
        if (!params.familia) delete params.familia
        if (!params.nome) delete params.nome

        const resultado = await listarDinossauros(params)
        if (!ativo) return
        setDinossauros(resultado.data || [])
      } catch (falha) {
        if (!ativo) return
        setDinossauros([])
        setErro(
          falha.message === 'Failed to fetch' || falha.message?.includes('fetch')
            ? 'Não foi possível buscar. Suba o backend com node app.js.'
            : falha.message || 'Falha ao buscar fichas.',
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [busca])

  function handleChange(evento) {
    const { name, value } = evento.target
    setFiltros((atual) => ({ ...atual, [name]: value }))
  }

  function handleSubmit(evento) {
    evento.preventDefault()
    setBusca({ ...filtros })
  }

  function limpar() {
    setFiltros(FILTROS_VAZIOS)
    setBusca(FILTROS_VAZIOS)
  }

  return (
    <section className="pagina">
      <h1>Catálogo de criaturas</h1>
      <p>Busque pelo nome ou filtre por tipo, período e dieta.</p>
      <p>
        <Link to="/dinossauros/novo" className="botao">
          Adicionar ficha
        </Link>
      </p>

      <form className="formulario busca-form" onSubmit={handleSubmit}>
        <label className="campo">
          Nome
          <input
            type="search"
            name="nome"
            value={filtros.nome}
            onChange={handleChange}
            placeholder="Ex: Tiranossauro"
          />
        </label>

        <label className="campo">
          Tipo
          <select name="tipo" value={filtros.tipo} onChange={handleChange}>
            <option value="">Todos</option>
            {TIPOS_CRIATURA.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          Período
          <select name="periodo" value={filtros.periodo} onChange={handleChange}>
            <option value="">Todos</option>
            {PERIODOS_TODOS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          Dieta
          <select name="dieta" value={filtros.dieta} onChange={handleChange}>
            <option value="">Todas</option>
            {DIETAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="busca-acoes">
          <button className="botao" type="submit">
            Buscar
          </button>
          <button className="botao botao-secundario" type="button" onClick={limpar}>
            Limpar
          </button>
        </div>
      </form>

      {erro ? <p className="alerta">{erro}</p> : null}
      {carregando ? <p>Buscando...</p> : null}

      {!carregando && !erro && dinossauros.length === 0 ? (
        <p>Nenhuma ficha encontrada.</p>
      ) : null}

      <div className="grade-dinos catalogo-grade">
        {dinossauros.map((dino) => (
          <article
            key={dino.id}
            className={`card-dino ${Number(usuario?.favoritoId) === Number(dino.id) || Number(usuario?.favorito?.id) === Number(dino.id) ? 'is-favorito' : ''}`}
          >
            <div
              className="card-dino-foto"
              style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
            >
              <BotaoFavorito dinoId={dino.id} />
            </div>
            <div className="card-dino-corpo">
              <BadgeTipo tipo={dino.tipo} />
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
    </section>
  )
}
