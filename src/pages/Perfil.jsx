import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { ehContaCriador } from '../constants'
import { useAuth } from '../context/AuthContext'
import { enviarFotoPerfil, getPerfil, atualizarDescricao } from '../services/authService'
import { listarDinossauros } from '../services/dinosaurService'
import { buscarUsuario, deixarDeSeguir, excluirUsuario, seguirUsuario } from '../services/userService'

const CAMPOS = {
  nome: 'Nome',
  nomeCientifico: 'Nome científico',
  periodo: 'Período',
  dieta: 'Dieta',
  familia: 'Família',
  descricao: 'Descrição',
  comprimento: 'Comprimento',
  regiao: 'Região',
  foto: 'Foto',
  anoDescoberta: 'Ano de descoberta',
  destaque: 'Destaque',
}

function formatarData(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function tempoRelativo(valor) {
  if (!valor) return ''
  const diff = Date.now() - new Date(valor).getTime()
  const minutos = Math.max(1, Math.floor(diff / 60000))
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 30) return `há ${dias} d`
  return formatarData(valor)
}

function mesesAtividade(edicoes, quantidade = 6) {
  const agora = new Date()
  const meses = []

  for (let i = quantidade - 1; i >= 0; i -= 1) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    meses.push({
      chave: `${data.getFullYear()}-${data.getMonth()}`,
      label: data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      total: 0,
    })
  }

  edicoes.forEach((edicao) => {
    const data = new Date(edicao.data)
    const chave = `${data.getFullYear()}-${data.getMonth()}`
    const mes = meses.find((item) => item.chave === chave)
    if (mes) mes.total += 1
  })

  return meses
}

function GraficoAtividade({ meses }) {
  const largura = 520
  const altura = 180
  const padding = { top: 16, right: 12, bottom: 28, left: 8 }
  const maximo = Math.max(1, ...meses.map((mes) => mes.total))
  const areaW = largura - padding.left - padding.right
  const areaH = altura - padding.top - padding.bottom
  const passo = meses.length > 1 ? areaW / (meses.length - 1) : areaW

  const pontos = meses.map((mes, indice) => {
    const x = padding.left + indice * passo
    const y = padding.top + areaH - (mes.total / maximo) * areaH
    return `${x},${y}`
  })

  const area = [
    `${padding.left},${padding.top + areaH}`,
    ...pontos,
    `${padding.left + (meses.length - 1) * passo},${padding.top + areaH}`,
  ].join(' ')

  return (
    <svg className="perfil-grafico" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="Contribuições ao longo do tempo">
      <defs>
        <linearGradient id="areaAtividade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ea33a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5ea33a" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((linha) => (
        <line
          key={linha}
          x1={padding.left}
          x2={largura - padding.right}
          y1={padding.top + areaH * linha}
          y2={padding.top + areaH * linha}
          stroke="rgba(255,255,255,0.08)"
        />
      ))}
      <polygon points={area} fill="url(#areaAtividade)" />
      <polyline
        points={pontos.join(' ')}
        fill="none"
        stroke="#7cc04f"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {meses.map((mes, indice) => {
        const x = padding.left + indice * passo
        const y = padding.top + areaH - (mes.total / maximo) * areaH
        return (
          <g key={mes.chave}>
            <circle cx={x} cy={y} r="4" fill="#5ea33a" stroke="#0b0d0b" strokeWidth="2" />
            <text x={x} y={altura - 6} textAnchor="middle" fill="#b7c2b0" fontSize="11">
              {mes.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function Perfil() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { autenticado, carregando, usuario, atualizarUsuario } = useAuth()
  const meuPerfil = !id || String(usuario?.id) === String(id)
  const [perfil, setPerfil] = useState(null)
  const [dinossauros, setDinossauros] = useState([])
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [erro, setErro] = useState('')
  const [salvandoFoto, setSalvandoFoto] = useState(false)
  const [seguindoAcao, setSeguindoAcao] = useState(false)
  const [buscando, setBuscando] = useState(true)
  const [textoBio, setTextoBio] = useState('')
  const [salvandoBio, setSalvandoBio] = useState(false)
  const [okBio, setOkBio] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const souCriador = ehContaCriador(usuario)
  const podeExcluir = souCriador && !meuPerfil && perfil && !perfil.criador

  useEffect(() => {
    if (!id && !autenticado) {
      if (!carregando) setBuscando(false)
      return
    }

    let ativo = true

    async function carregar() {
      setBuscando(true)
      setErro('')
      try {
        const dados = !id ? await getPerfil() : await buscarUsuario(id)
        const lista = await listarDinossauros({
          criadoPor: dados.id,
          limit: 50,
          sort: 'id',
          order: 'desc',
        }).catch(() => ({ data: [] }))

        if (!ativo) return

        const meus = (lista.data || []).filter((dino) => dino.usuarioId === dados.id)
        setPerfil(dados)
        setTextoBio(dados.descricao || '')
        setDinossauros(meus)
      } catch (falha) {
        if (ativo) {
          const texto = falha.message || 'Não foi possível carregar o perfil.'
          if (!/404/.test(texto)) setErro(texto)
        }
      } finally {
        if (ativo) setBuscando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [autenticado, carregando, id])

  const edicoes = perfil?.edicoes || []
  const meses = useMemo(() => mesesAtividade(edicoes), [edicoes])
  const edicoesVisiveis = historicoAberto ? edicoes : edicoes.slice(0, 5)
  const seguidores = perfil?.seguidores || []
  const seguindo = perfil?.seguindo || []
  const totalSeguidores = perfil?.estatisticas?.seguidores ?? seguidores.length
  const totalSeguindo = perfil?.estatisticas?.seguindo ?? seguindo.length

  async function aplicarPerfil(dados) {
    setPerfil(dados)
    if (dados.descricao !== undefined) {
      setTextoBio(dados.descricao || '')
    }
    atualizarUsuario(dados)
  }

  async function handleDescricao(evento) {
    evento.preventDefault()
    setOkBio('')
    setSalvandoBio(true)
    try {
      const dados = await atualizarDescricao(textoBio)
      await aplicarPerfil(dados)
      setOkBio('Descrição salva.')
    } catch {
      setOkBio('')
    } finally {
      setSalvandoBio(false)
    }
  }

  async function handleSeguir() {
    if (!autenticado) {
      navigate('/login')
      return
    }
    if (!perfil?.id) return

    setSeguindoAcao(true)
    try {
      const dados = perfil.seguindoEste
        ? await deixarDeSeguir(perfil.id)
        : await seguirUsuario(perfil.id)
      setPerfil(dados)
    } catch {
      /* segue na tela sem aviso vermelho */
    } finally {
      setSeguindoAcao(false)
    }
  }

  async function handleExcluirPerfil() {
    if (!perfil?.id || !podeExcluir) return
    const ok = window.confirm(`Excluir o perfil de ${perfil.nome}? Essa ação não tem volta.`)
    if (!ok) return

    setExcluindo(true)
    try {
      await excluirUsuario(perfil.id)
      navigate('/amigos', { replace: true })
    } catch {
      setExcluindo(false)
    }
  }

  async function handleFotoArquivo(evento) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return

    setSalvandoFoto(true)
    try {
      const dados = await enviarFotoPerfil(arquivo)
      await aplicarPerfil(dados)
    } catch {
      /* segue na tela sem aviso vermelho */
    } finally {
      setSalvandoFoto(false)
    }
  }

  if (id && usuario && String(usuario.id) === String(id)) {
    return <Navigate to="/perfil" replace />
  }

  if (carregando && !id) {
    return (
      <section className="pagina pagina-perfil">
        <p>Carregando perfil...</p>
      </section>
    )
  }

  if (meuPerfil && !autenticado) {
    return <Navigate to="/login" replace />
  }

  if (erro) {
    return (
      <section className="pagina pagina-perfil">
        <h1>Perfil</h1>
        <p className="alerta">{erro}</p>
      </section>
    )
  }

  if (buscando || !perfil) {
    return (
      <section className="pagina pagina-perfil">
        <p>Carregando perfil...</p>
      </section>
    )
  }

  return (
    <section className="pagina pagina-perfil">
      <article className="perfil-cartao perfil-resumo">
        <div className="perfil-identidade">
          <Avatar usuario={perfil} />
          <div>
            <div className="perfil-nome">
              <h1>{perfil?.nome}</h1>
              <span className="perfil-badge">{perfil?.nivel?.nome || 'Colaborador'}</span>
              {perfil?.criador ? <span className="perfil-badge perfil-badge-criador">Criador</span> : null}
            </div>
            {meuPerfil && perfil?.email ? <p className="perfil-meta">{perfil.email}</p> : null}
            {meuPerfil ? (
              <form className="perfil-bio-form" onSubmit={handleDescricao}>
                <label className="campo">
                  Descrição do perfil
                  <textarea
                    rows="3"
                    maxLength={400}
                    value={textoBio}
                    onChange={(evento) => {
                      setTextoBio(evento.target.value)
                      setOkBio('')
                    }}
                    placeholder="Conte um pouco sobre você, seus dinos favoritos ou o que você pesquisa."
                  />
                </label>
                <p className="bloco-curiosidades-ajuda">
                  Foto ou avatar vale +10 pontos. Descrição vale +10 pontos.
                </p>
                <div className="perfil-bio-acoes">
                  <small>{textoBio.length}/400</small>
                  <button className="botao" type="submit" disabled={salvandoBio}>
                    {salvandoBio ? 'Salvando...' : 'Salvar descrição'}
                  </button>
                </div>
                {okBio ? <p className="ok">{okBio}</p> : null}
              </form>
            ) : (
              <p className="perfil-bio">
                {perfil?.descricao?.trim()
                  ? perfil.descricao
                  : 'Este colaborador ainda não escreveu uma descrição.'}
              </p>
            )}
            <div className="perfil-foto-acoes">
              {meuPerfil ? (
                <label className="botao botao-fantasma perfil-upload">
                  {salvandoFoto ? 'Salvando...' : 'Enviar minha foto'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={handleFotoArquivo}
                    disabled={salvandoFoto}
                  />
                </label>
              ) : (
                <button
                  type="button"
                  className={perfil.seguindoEste ? 'botao botao-fantasma' : 'botao'}
                  onClick={handleSeguir}
                  disabled={seguindoAcao}
                >
                  {seguindoAcao ? 'Salvando...' : perfil.seguindoEste ? 'Deixar de seguir' : 'Seguir'}
                </button>
              )}
              <Link to="/amigos" className="botao botao-fantasma">
                Ver amigos
              </Link>
              <Link to="/ranking" className="botao botao-fantasma">
                Ranking
              </Link>
              {podeExcluir ? (
                <button
                  type="button"
                  className="botao botao-perigo"
                  onClick={handleExcluirPerfil}
                  disabled={excluindo}
                >
                  {excluindo ? 'Excluindo...' : 'Excluir perfil'}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <ul className="perfil-stats">
          <li>
            <strong>{perfil?.pontos || 0}</strong>
            <span>
              Pontos
              {perfil?.nivel?.proximo
                ? ` · faltam ${perfil.nivel.faltam} para ${perfil.nivel.proximo.nome}`
                : ''}
            </span>
          </li>
          <li>
            <strong>{edicoes.length}</strong>
            <span>Edições realizadas</span>
          </li>
          <li>
            <strong>{dinossauros.length}</strong>
            <span>Dinossauros cadastrados</span>
          </li>
          <li>
            <strong>{totalSeguidores}</strong>
            <span>Seguidores</span>
          </li>
          <li>
            <strong>{totalSeguindo}</strong>
            <span>Seguindo</span>
          </li>
        </ul>
      </article>

      <div className="perfil-grade">
        <article className="perfil-cartao">
          <div className="perfil-cartao-topo">
            <h2>Resumo de atividade</h2>
            <span>Últimos 6 meses</span>
          </div>
          <p className="perfil-cartao-legenda">
            {meuPerfil ? 'Suas contribuições ao longo do tempo' : 'Contribuições ao longo do tempo'}
          </p>
          <GraficoAtividade meses={meses} />
        </article>

        <article className="perfil-cartao">
          <div className="perfil-cartao-topo">
            <h2>Edições recentes</h2>
          </div>
          {edicoesVisiveis.length === 0 ? (
            <p>{meuPerfil ? 'Você ainda não editou nenhuma ficha.' : 'Ainda não há edições neste perfil.'}</p>
          ) : (
            <ul className="perfil-edicoes">
              {edicoesVisiveis.map((edicao) => (
                <li key={edicao.id}>
                  <Link to={`/dinossauros/${edicao.dinossauroId}`}>
                    {edicao.dinossauroNome}
                  </Link>
                  <p>
                    Alterou {CAMPOS[edicao.campo] || edicao.campo}
                    {edicao.valorNovo ? `: ${String(edicao.valorNovo).slice(0, 48)}` : ''}
                  </p>
                  <small>{tempoRelativo(edicao.data)}</small>
                </li>
              ))}
            </ul>
          )}
          {edicoes.length > 5 ? (
            <button
              type="button"
              className="botao botao-fantasma"
              onClick={() => setHistoricoAberto((aberto) => !aberto)}
            >
              {historicoAberto ? 'Ver menos' : 'Ver histórico completo'}
            </button>
          ) : null}
        </article>
      </div>

      {(perfil?.historicoPontos || []).length > 0 ? (
        <article className="perfil-cartao">
          <div className="perfil-cartao-topo">
            <h2>Pontos recentes</h2>
            <Link to="/ranking">Ver ranking</Link>
          </div>
          <ul className="perfil-edicoes">
            {perfil.historicoPontos.map((evento) => (
              <li key={evento.id}>
                <p>
                  {evento.descricao}
                  <strong> +{evento.pontos}</strong>
                </p>
                <small>{tempoRelativo(evento.data)}</small>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <article className="perfil-cartao">
        <div className="perfil-cartao-topo">
          <h2>{meuPerfil ? 'Meus dinossauros cadastrados' : 'Dinossauros cadastrados'}</h2>
          {meuPerfil ? <Link to="/dinossauros/novo">Adicionar</Link> : null}
        </div>
        {dinossauros.length === 0 ? (
          <p>Nenhum dinossauro cadastrado ainda.</p>
        ) : (
          <div className="perfil-dinos">
            {dinossauros.map((dino) => (
              <Link key={dino.id} to={`/dinossauros/${dino.id}`} className="perfil-dino">
                <div
                  className="perfil-dino-foto"
                  style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
                />
                <strong>{dino.nome}</strong>
                <small>Cadastrado em {formatarData(dino.criadoEm)}</small>
              </Link>
            ))}
          </div>
        )}
      </article>

      <div className="perfil-grade">
        <article className="perfil-cartao">
          <div className="perfil-cartao-topo">
            <h2>Seguidores</h2>
            <span>{totalSeguidores}</span>
          </div>
          {seguidores.length === 0 ? (
            <p>Ninguém segue este perfil ainda.</p>
          ) : (
            <ul className="lista-pessoas">
              {seguidores.map((pessoa) => (
                <li key={pessoa.id}>
                  <Link to={`/usuarios/${pessoa.id}`}>
                    <Avatar usuario={pessoa} className="lista-pessoa-foto" />
                    {pessoa.nome}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="perfil-cartao">
          <div className="perfil-cartao-topo">
            <h2>Seguindo</h2>
            <span>{totalSeguindo}</span>
          </div>
          {seguindo.length === 0 ? (
            <p>Este perfil ainda não segue ninguém.</p>
          ) : (
            <ul className="lista-pessoas">
              {seguindo.map((pessoa) => (
                <li key={pessoa.id}>
                  <Link to={`/usuarios/${pessoa.id}`}>
                    <Avatar usuario={pessoa} className="lista-pessoa-foto" />
                    {pessoa.nome}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
