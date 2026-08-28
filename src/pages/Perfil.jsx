import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { ehContaCriador } from '../constants'
import { conquistasDoPerfil } from '../constants/conquistas'
import { useAuth } from '../context/AuthContext'
import { enviarFotoPerfil, getPerfil, atualizarDescricao, atualizarEnfeites } from '../services/authService'
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

function detalheEnfeite(item) {
  if (!item.desbloqueado) {
    return item.soCriador ? 'Exclusivo do criador' : `Faltam ${item.faltam} pts`
  }
  if (item.equipado) return 'No perfil'
  if (item.soCriador) return 'Só você'
  return `${item.min} pts`
}

function tituloEnfeite(item) {
  if (item.desbloqueado || item.soCriador) return item.descricao
  return `Desbloqueia com ${item.min} pontos`
}

function classeEnfeite(item) {
  return [
    'enfeite-opcao',
    item.equipado ? 'is-ativo' : '',
    item.desbloqueado ? '' : 'is-bloqueado',
    item.soCriador ? 'enfeite-exclusivo' : '',
  ]
    .filter(Boolean)
    .join(' ')
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

function inicioDoDia(valor) {
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

function chaveDia(valor) {
  const data = inicioDoDia(valor)
  if (!data) return null
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function nivelAtividade(total) {
  if (!total) return 0
  if (total === 1) return 1
  if (total <= 3) return 2
  if (total <= 6) return 3
  return 4
}

function tituloDia(dia) {
  if (!dia?.data || dia.fora || dia.futuro) return undefined
  const quando = dia.data.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  if (dia.total === 1) return `1 contribuição em ${quando}`
  return `${dia.total} contribuições em ${quando}`
}

function diasAtividade({ edicoes = [], topicos = [], dinossauros = [] }) {
  const hoje = inicioDoDia(new Date())
  const inicio = new Date(hoje)
  inicio.setDate(inicio.getDate() - 364)

  const comecoGrade = new Date(inicio)
  comecoGrade.setDate(comecoGrade.getDate() - comecoGrade.getDay())

  const contagem = new Map()

  function somar(valor) {
    const data = inicioDoDia(valor)
    const chave = chaveDia(valor)
    if (!data || !chave || data < inicio || data > hoje) return
    contagem.set(chave, (contagem.get(chave) || 0) + 1)
  }

  edicoes.forEach((edicao) => somar(edicao.data))
  topicos.forEach((topico) => somar(topico.criadoEm || topico.atualizadoEm))
  dinossauros.forEach((dino) => somar(dino.criadoEm))

  const semanas = []
  let semana = []
  const cursor = new Date(comecoGrade)

  while (cursor <= hoje || semana.length > 0) {
    const chave = chaveDia(cursor)
    const fora = cursor < inicio
    const futuro = cursor > hoje
    semana.push({
      chave: futuro ? `futuro-${semana.length}` : chave,
      data: new Date(cursor),
      total: fora || futuro ? 0 : contagem.get(chave) || 0,
      fora,
      futuro,
    })

    cursor.setDate(cursor.getDate() + 1)

    if (semana.length === 7) {
      semanas.push(semana)
      semana = []
      if (cursor > hoje) break
    }
  }

  const total = [...contagem.values()].reduce((soma, valor) => soma + valor, 0)
  return { semanas, total }
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function GraficoAtividade({ semanas }) {
  return (
    <div className="perfil-heatmap" role="img" aria-label="Contribuições por dia no último ano">
      <div className="perfil-heatmap-dias" aria-hidden="true">
        <div className="perfil-heatmap-meses" />
        <div className="perfil-heatmap-semana">
          <span />
          <span>Seg</span>
          <span />
          <span>Qua</span>
          <span />
          <span>Sex</span>
          <span />
        </div>
      </div>
      <div className="perfil-heatmap-scroll">
        <div className="perfil-heatmap-meses" aria-hidden="true">
          {semanas.map((semana, indice) => {
            const diaUm = semana.find(
              (dia) => dia.data && dia.data.getDate() === 1 && !dia.futuro && !dia.fora,
            )
            const fonte =
              diaUm ||
              (indice === 0 ? semana.find((dia) => !dia.fora && !dia.futuro) : null)
            const label = fonte ? MESES_CURTOS[fonte.data.getMonth()] : ''
            return (
              <span key={`mes-${semana[0].chave}`} className="perfil-heatmap-mes">
                {label}
              </span>
            )
          })}
        </div>
        <div className="perfil-heatmap-grade">
          {semanas.map((semana) => (
            <div key={semana[0].chave} className="perfil-heatmap-semana">
              {semana.map((dia) => (
                <span
                  key={dia.chave}
                  className={`perfil-heatmap-celula n${nivelAtividade(dia.total)}${dia.fora || dia.futuro ? ' is-fora' : ''}`}
                  title={tituloDia(dia)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Perfil() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { autenticado, carregando, usuario, atualizarUsuario } = useAuth()
  const meuPerfil = !id
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
  const [salvandoEnfeite, setSalvandoEnfeite] = useState(false)
  const [okEnfeite, setOkEnfeite] = useState('')
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

        const meus = (lista.data || []).filter(
          (dino) => String(dino.usuarioId) === String(dados.id),
        )
        setPerfil(dados)
        setTextoBio(dados.descricao || '')
        setDinossauros(meus)
        if (!id || String(usuario?.id) === String(dados.id)) {
          atualizarUsuario(dados)
        }
      } catch (falha) {
        if (ativo) {
          setErro(
            falha.status === 404
              ? 'Este perfil não existe ou ainda não foi confirmado.'
              : falha.message || 'Não foi possível carregar o perfil.',
          )
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

  useEffect(() => {
    if (buscando || !perfil || !location.hash) return undefined

    const alvo = document.getElementById(location.hash.replace('#', ''))
    if (!alvo) return undefined

    const ir = window.setTimeout(() => {
      alvo.scrollIntoView({ behavior: 'smooth', block: 'start' })
      alvo.classList.add('is-alvo')
    }, 80)
    const limpar = window.setTimeout(() => alvo.classList.remove('is-alvo'), 1800)

    return () => {
      window.clearTimeout(ir)
      window.clearTimeout(limpar)
      alvo.classList.remove('is-alvo')
    }
  }, [buscando, perfil, location.hash, location.pathname])

  const edicoes = perfil?.edicoes || []
  const topicos = perfil?.topicos || []
  const conquistas = useMemo(
    () => conquistasDoPerfil(perfil, dinossauros),
    [perfil, dinossauros],
  )
  const atividade = useMemo(
    () => diasAtividade({ edicoes, topicos, dinossauros }),
    [edicoes, topicos, dinossauros],
  )
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
    if (!id || String(usuario?.id) === String(dados.id)) {
      atualizarUsuario(dados)
    }
  }

  async function handleEnfeite(item) {
    if (!item.desbloqueado || salvandoEnfeite) return
    setOkEnfeite('')
    const catalogo = perfil?.enfeitesCatalogo || []
    const outros = catalogo
      .filter((enfeite) => enfeite.equipado && enfeite.tipo !== item.tipo)
      .map((enfeite) => enfeite.id)
    const proximo = item.equipado ? outros : [...outros, item.id]
    setSalvandoEnfeite(true)
    try {
      const dados = await atualizarEnfeites(proximo)
      await aplicarPerfil(dados)
      setOkEnfeite(item.equipado ? 'Enfeite removido.' : `${item.nome} colocado no perfil.`)
    } catch (falha) {
      setOkEnfeite(falha.message || 'Não foi possível mudar o enfeite.')
    } finally {
      setSalvandoEnfeite(false)
    }
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
    return <Navigate to={{ pathname: '/perfil', hash: location.hash }} replace />
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
            {perfil?.favorito ? (
              <p className="perfil-meta">
                Dinossauro favorito:{' '}
                <Link to={`/dinossauros/${perfil.favorito.id}`}>{perfil.favorito.nome}</Link>
              </p>
            ) : null}
            {conquistas.desbloqueadas > 0 ? (
              <ul className="perfil-medalhas" aria-label="Conquistas desbloqueadas">
                {conquistas.itens
                  .filter((conquista) => conquista.desbloqueada)
                  .map((conquista) => (
                    <li key={conquista.id} title={conquista.nome} aria-label={conquista.nome}>
                      {conquista.simbolo}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="perfil-meta">
                {meuPerfil
                  ? 'Ainda sem conquistas. Contribua na DinoPédia para desbloquear as primeiras.'
                  : 'Esta pessoa ainda não desbloqueou conquistas.'}
              </p>
            )}
            {!meuPerfil ? (
              <p className="perfil-bio">
                {perfil?.descricao?.trim()
                  ? perfil.descricao
                  : 'Este colaborador ainda não escreveu uma descrição.'}
              </p>
            ) : null}
            <div className="perfil-foto-acoes">
              {!meuPerfil ? (
                <button
                  type="button"
                  className={perfil.seguindoEste ? 'botao botao-fantasma' : 'botao'}
                  onClick={handleSeguir}
                  disabled={seguindoAcao}
                >
                  {seguindoAcao ? 'Salvando...' : perfil.seguindoEste ? 'Deixar de seguir' : 'Seguir'}
                </button>
              ) : null}
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
            <strong>{topicos.length}</strong>
            <span>Tópicos criados</span>
          </li>
          <li>
            <strong>{dinossauros.length}</strong>
            <span>Dinossauros cadastrados</span>
          </li>
          <li>
            <strong>{conquistas.desbloqueadas}</strong>
            <span>Conquistas</span>
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

      <article className="perfil-cartao" id="favorito">
        <div className="perfil-cartao-topo">
          <h2>Dinossauro favorito</h2>
          {perfil.favorito ? <Link to={`/dinossauros/${perfil.favorito.id}`}>Ver ficha</Link> : null}
        </div>
        {perfil.favorito ? (
          <Link to={`/dinossauros/${perfil.favorito.id}`} className="perfil-favorito">
            <div
              className="perfil-favorito-foto"
              style={perfil.favorito.fotoUrl ? { backgroundImage: `url(${perfil.favorito.fotoUrl})` } : undefined}
            />
            <span>
              <strong>{perfil.favorito.nome}</strong>
              {perfil.favorito.nomeCientifico ? <small>{perfil.favorito.nomeCientifico}</small> : null}
              {perfil.favorito.periodo ? <small>{perfil.favorito.periodo}</small> : null}
            </span>
          </Link>
        ) : (
          <p>
            {meuPerfil
              ? 'Ainda sem favorito. Toque no coração da ficha ou do catálogo para curtir um dinossauro.'
              : 'Esta pessoa ainda não escolheu um dinossauro favorito.'}
          </p>
        )}
      </article>

      <article className="perfil-cartao" id="conquistas">
        <div className="perfil-cartao-topo">
          <h2>Conquistas</h2>
          <span>
            {conquistas.desbloqueadas}/{conquistas.total}
          </span>
        </div>
        <p className="perfil-cartao-legenda">
          {meuPerfil
            ? 'Marcas do que você já fez na DinoPédia. As apagadas ainda faltam.'
            : 'Marcas do que esta pessoa já fez na DinoPédia.'}
        </p>
        <ul className="lista-conquistas">
          {[...conquistas.itens]
            .sort((a, b) => Number(b.desbloqueada) - Number(a.desbloqueada))
            .map((conquista) => (
            <li
              key={conquista.id}
              className={`conquista ${conquista.desbloqueada ? 'is-on' : 'is-off'}`}
              title={conquista.descricao}
            >
              <span className="conquista-simbolo" aria-hidden="true">
                {conquista.simbolo}
              </span>
              <strong>{conquista.nome}</strong>
              <p>{conquista.descricao}</p>
              <div className="conquista-barra" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.max(
                      conquista.desbloqueada ? 100 : 0,
                      Math.round((conquista.atual / conquista.meta) * 100),
                    )}%`,
                  }}
                />
              </div>
              <small>
                {conquista.desbloqueada
                  ? 'Desbloqueada'
                  : `${conquista.atual}/${conquista.meta}`}
              </small>
            </li>
          ))}
        </ul>
      </article>

      {meuPerfil ? (
        <article className="perfil-cartao" id="configuracoes">
          <div className="perfil-cartao-topo">
            <h2>Configurações</h2>
          </div>
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
          <div className="perfil-foto-acoes">
            <label className="botao botao-fantasma perfil-upload">
              {salvandoFoto ? 'Salvando...' : 'Enviar minha foto'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleFotoArquivo}
                disabled={salvandoFoto}
              />
            </label>
          </div>
          <div className="perfil-enfeites" id="enfeites">
            <h3>Enfeites do perfil</h3>
            <p className="perfil-cartao-legenda">
              Os pontos desbloqueiam molduras e broches. Toque para colocar ou tirar. Uma moldura e um broche por vez.
              {(perfil?.enfeitesCatalogo || []).some((item) => item.soCriador)
                ? ' O selo do criador só aparece nesta conta.'
                : ''}
            </p>
            <p className="bloco-curiosidades-ajuda">Molduras</p>
            <div className="grade-enfeites">
              {(perfil?.enfeitesCatalogo || [])
                .filter((item) => item.tipo === 'moldura')
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={classeEnfeite(item)}
                    onClick={() => handleEnfeite(item)}
                    disabled={!item.desbloqueado || salvandoEnfeite}
                    title={tituloEnfeite(item)}
                  >
                    <span aria-hidden="true">{item.simbolo}</span>
                    <strong>{item.nome}</strong>
                    <small>{detalheEnfeite(item)}</small>
                  </button>
                ))}
            </div>
            <p className="bloco-curiosidades-ajuda">Broches</p>
            <div className="grade-enfeites">
              {(perfil?.enfeitesCatalogo || [])
                .filter((item) => item.tipo === 'broche')
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={classeEnfeite(item)}
                    onClick={() => handleEnfeite(item)}
                    disabled={!item.desbloqueado || salvandoEnfeite}
                    title={tituloEnfeite(item)}
                  >
                    <span aria-hidden="true">{item.simbolo}</span>
                    <strong>{item.nome}</strong>
                    <small>{detalheEnfeite(item)}</small>
                  </button>
                ))}
            </div>
            {okEnfeite ? <p className="ok">{okEnfeite}</p> : null}
          </div>
        </article>
      ) : null}

      <article className="perfil-cartao" id="meus-topicos">
        <div className="perfil-cartao-topo">
          <h2>{meuPerfil ? 'Meus tópicos' : 'Tópicos'}</h2>
          <span>{topicos.length}</span>
        </div>
        {topicos.length === 0 ? (
          <p>
            {meuPerfil
              ? 'Você ainda não escreveu nenhum tópico. Abra uma ficha e adicione uma curiosidade.'
              : 'Ainda não há tópicos neste perfil.'}
          </p>
        ) : (
          <ul className="perfil-edicoes">
            {topicos.map((topico) => (
              <li key={topico.id}>
                <Link to={`/dinossauros/${topico.dinossauroId}`}>{topico.dinossauroNome}</Link>
                <p>
                  {topico.categoria}
                  {topico.texto ? `: ${String(topico.texto).slice(0, 90)}` : ''}
                </p>
                <small>{tempoRelativo(topico.criadoEm || topico.atualizadoEm)}</small>
              </li>
            ))}
          </ul>
        )}
        {meuPerfil ? (
          <Link to="/dinossauros" className="botao botao-fantasma">
            Escrever tópico numa ficha
          </Link>
        ) : null}
      </article>

      <article className="perfil-cartao perfil-atividade">
        <div className="perfil-cartao-topo">
          <h2>Resumo de atividade</h2>
          <span>
            {atividade.total} {atividade.total === 1 ? 'contribuição' : 'contribuições'} no último ano
          </span>
        </div>
        <p className="perfil-cartao-legenda">
          {meuPerfil ? 'Suas contribuições por dia' : 'Contribuições por dia'}
        </p>
        <GraficoAtividade semanas={atividade.semanas} />
        <p className="perfil-heatmap-legenda">
          Menos
          {[0, 1, 2, 3, 4].map((nivel) => (
            <span key={nivel} className={`perfil-heatmap-celula n${nivel}`} />
          ))}
          Mais
        </p>
      </article>

      <article className="perfil-cartao" id="edicoes">
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
              <Link key={dino.id} to={`/dinossauros/${dino.id}`} className={`perfil-dino ${Number(perfil?.favoritoId) === Number(dino.id) || Number(perfil?.favorito?.id) === Number(dino.id) ? 'is-favorito' : ''}`}>
                <div
                  className="perfil-dino-foto"
                  style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
                />
                <strong>{dino.nome}</strong>
                <small>
                  {Number(perfil?.favoritoId) === Number(dino.id) || Number(perfil?.favorito?.id) === Number(dino.id)
                    ? 'Favorito · '
                    : ''}
                  Cadastrado em {formatarData(dino.criadoEm)}
                </small>
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
