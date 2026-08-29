import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  TIPOS_CRIATURA,
  configTipo,
  fichaDoServidor,
  fichaVazia,
  montarPayload,
} from '../constants'
import { useAuth } from '../context/AuthContext'
import { getPerfil } from '../services/authService'
import {
  atualizarDinossauro,
  atualizarTopico,
  buscarDinossauro,
  criarDinossauro,
  criarTopico,
  deletarTopico,
  enviarFoto,
} from '../services/dinosaurService'

function novaCuriosidade(tipo) {
  const cfg = configTipo(tipo)
  return {
    localId: `novo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: null,
    categoria: cfg.topicos[cfg.topicos.length - 1] || 'Curiosidade',
    texto: '',
  }
}

export default function CadastroDinossauro() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const editando = Boolean(id)
  const tipoUrl = searchParams.get('tipo') || ''
  const navigate = useNavigate()
  const { autenticado, carregando, atualizarUsuario } = useAuth()
  const [ficha, setFicha] = useState(fichaVazia('dinossauro'))
  const [tipoEscolhido, setTipoEscolhido] = useState(editando || Boolean(tipoUrl))
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [topicos, setTopicos] = useState([novaCuriosidade('dinossauro')])
  const [topicosRemovidos, setTopicosRemovidos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const cfg = configTipo(ficha.tipo)

  useEffect(() => {
    if (editando) return

    if (tipoUrl && TIPOS_CRIATURA.some((tipo) => tipo.id === tipoUrl)) {
      setFicha(fichaVazia(tipoUrl))
      setTopicos([novaCuriosidade(tipoUrl)])
      setTipoEscolhido(true)
    }
  }, [editando, tipoUrl])

  useEffect(() => {
    if (!editando) return

    buscarDinossauro(id)
      .then((dino) => {
        const carregada = fichaDoServidor(dino)
        setFicha(carregada)
        setTipoEscolhido(true)
        if (dino.fotoUrl) setPreview(dino.fotoUrl)
        const existentes = (dino.topicos || []).map((topico) => ({
          localId: `salvo-${topico.id}`,
          id: topico.id,
          categoria: topico.categoria || 'Curiosidade',
          texto: topico.texto || '',
        }))
        setTopicos(existentes.length ? existentes : [novaCuriosidade(carregada.tipo)])
        setTopicosRemovidos([])
      })
      .catch((falha) => setErro(falha.message || 'Não foi possível carregar a ficha.'))
  }, [editando, id])

  function escolherTipo(tipoId) {
    setFicha(fichaVazia(tipoId))
    setTopicos([novaCuriosidade(tipoId)])
    setTipoEscolhido(true)
    navigate(`/dinossauros/novo?tipo=${tipoId}`, { replace: true })
  }

  function handleChange(evento) {
    const { name, value, type, checked } = evento.target
    setFicha((atual) => ({
      ...atual,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleFoto(evento) {
    const arquivo = evento.target.files?.[0]
    setFoto(arquivo || null)
    setPreview(arquivo ? URL.createObjectURL(arquivo) : preview)
  }

  function handleTopico(localId, campo, valor) {
    setTopicos((atual) =>
      atual.map((topico) => (topico.localId === localId ? { ...topico, [campo]: valor } : topico)),
    )
  }

  function adicionarCuriosidade() {
    setTopicos((atual) => [...atual, novaCuriosidade(ficha.tipo)])
  }

  function removerCuriosidade(topico) {
    if (topico.id) {
      setTopicosRemovidos((atual) => [...atual, topico.id])
    }
    setTopicos((atual) => {
      const resto = atual.filter((item) => item.localId !== topico.localId)
      return resto.length ? resto : [novaCuriosidade(ficha.tipo)]
    })
  }

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)

    const dados = montarPayload(ficha)

    try {
      const incompletos = topicos.some((topico) => {
        const texto = topico.texto.trim()
        return texto.length > 0 && texto.length < 20
      })

      if (incompletos) {
        throw new Error('A curiosidade precisa ter no mínimo 20 caracteres, ou deixe em branco.')
      }

      const resposta = editando
        ? await atualizarDinossauro(id, dados)
        : await criarDinossauro(dados)

      const criado = resposta.dinossauro
      const dinoId = criado?.id || id

      if (foto && dinoId) {
        await enviarFoto(dinoId, foto)
      }

      for (const topicoId of topicosRemovidos) {
        await deletarTopico(dinoId, topicoId)
      }

      for (const topico of topicos) {
        const texto = topico.texto.trim()
        if (texto.length < 20) continue

        if (topico.id) {
          await atualizarTopico(dinoId, topico.id, {
            categoria: topico.categoria,
            texto,
          })
        } else {
          await criarTopico(dinoId, {
            categoria: topico.categoria,
            texto,
          })
        }
      }

      try {
        const perfilAtual = await getPerfil()
        atualizarUsuario(perfilAtual)
      } catch {
        /* o header atualiza no próximo carregamento */
      }

      navigate('/')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar a ficha.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <section className="pagina">
        <p>Carregando...</p>
      </section>
    )
  }

  if (!autenticado) {
    return (
      <section className="pagina">
        <h1>Adicionar ficha</h1>
        <p>Entre na sua conta para criar uma ficha. O cadastro precisa estar confirmado no Gmail.</p>
        <div className="busca-acoes">
          <Link to="/login" className="botao">
            Entrar
          </Link>
          <Link to="/registrar" className="botao botao-fantasma">
            Criar conta
          </Link>
        </div>
      </section>
    )
  }

  if (!editando && !tipoEscolhido) {
    return (
      <section className="pagina">
        <h1>Que tipo de criatura?</h1>
        <p>Escolha o tipo para abrir o formulário certo: dinossauro, pterossauro, réptil marinho, mamífero ou outro animal.</p>
        <div className="grade-tipos">
          {TIPOS_CRIATURA.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              className="cartao-tipo"
              onClick={() => escolherTipo(tipo.id)}
            >
              <span className="cartao-tipo-simbolo" aria-hidden="true">
                {tipo.simbolo}
              </span>
              <strong>{tipo.nome}</strong>
            </button>
          ))}
        </div>
        <p style={{ marginTop: 24 }}>
          <Link to="/dinossauros" className="botao botao-fantasma">
            Voltar ao catálogo
          </Link>
        </p>
      </section>
    )
  }

  return (
    <section className="pagina">
      <h1>
        {editando ? `Editar ${cfg.nome.toLowerCase()}` : `Adicionar ${cfg.nome.toLowerCase()}`}
      </h1>
      <p>
        {editando
          ? 'Altere a ficha e as curiosidades desta criatura.'
          : 'Preencha os campos comuns e os específicos deste tipo de animal.'}
      </p>
      {!editando ? (
        <p>
          <button
            type="button"
            className="botao botao-fantasma"
            onClick={() => {
              setTipoEscolhido(false)
              navigate('/dinossauros/novo')
            }}
          >
            Trocar tipo
          </button>
        </p>
      ) : null}

      <form className="formulario form-ficha cartao" onSubmit={handleSubmit}>
        {erro ? <p className="alerta">{erro}</p> : null}

        <label className="campo campo-foto">
          {cfg.rotuloFoto}
          {preview ? (
            <img src={preview} alt="Prévia" className="preview-foto" />
          ) : (
            <span className="preview-foto preview-foto--vazia">Sem foto ainda</span>
          )}
          <input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleFoto} />
        </label>

        <label className="campo">
          Nome
          <input name="nome" value={ficha.nome} onChange={handleChange} required />
        </label>

        <label className="campo">
          Nome científico
          <input name="nomeCientifico" value={ficha.nomeCientifico} onChange={handleChange} required />
        </label>

        <label className="campo">
          Período
          <select name="periodo" value={ficha.periodo} onChange={handleChange} required>
            {cfg.periodos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {cfg.dietaObrigatoria ? (
          <label className="campo">
            Dieta
            <select name="dieta" value={ficha.dieta} onChange={handleChange} required>
              {['Carnívoro', 'Herbívoro', 'Onívoro'].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="campo">
            Dieta (opcional)
            <select name="dieta" value={ficha.dieta} onChange={handleChange}>
              {['Não informado', 'Carnívoro', 'Herbívoro', 'Onívoro'].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="campo">
          {cfg.rotuloGrupo}
          <select name="grupo" value={ficha.grupo} onChange={handleChange}>
            <option value="">Não informar</option>
            {cfg.grupos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {ficha.tipo === 'outro' ? (
          <label className="campo">
            {cfg.rotuloTamanho}
            <input name="tamanho" value={ficha.tamanho} onChange={handleChange} placeholder="Ex: 2 m de comprimento" />
          </label>
        ) : (
          <label className="campo">
            {cfg.rotuloTamanho}
            <input
              type="number"
              name="comprimento"
              min="0"
              step="0.1"
              value={ficha.comprimento}
              onChange={handleChange}
            />
          </label>
        )}

        {ficha.tipo === 'pterossauro' ? (
          <>
            <label className="campo">
              Envergura (m)
              <input
                type="number"
                name="envergura"
                min="0"
                step="0.1"
                value={ficha.envergura}
                onChange={handleChange}
              />
            </label>
            <label className="campo">
              Modo de voo
              <select name="modoVoo" value={ficha.modoVoo} onChange={handleChange}>
                {cfg.modosVoo.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {ficha.tipo === 'reptil_marinho' ? (
          <label className="campo">
            Habitat
            <select name="habitat" value={ficha.habitat} onChange={handleChange}>
              {cfg.habitats.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {ficha.tipo === 'mamifero' ? (
          <>
            <label className="campo">
              Peso (kg)
              <input
                type="number"
                name="peso"
                min="0"
                step="1"
                value={ficha.peso}
                onChange={handleChange}
              />
            </label>
            <label className="campo">
              Pelagem
              <select name="pelagem" value={ficha.pelagem} onChange={handleChange}>
                {cfg.pelagens.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <label className="campo">
          Região / local
          <input
            name="regiao"
            value={ficha.regiao}
            onChange={handleChange}
            placeholder="Ex: Argentina, Montana, Deserto de Gobi"
          />
          <small className="campo-ajuda">
            O mapa da home coloca o balão neste lugar, com a foto da ficha.
          </small>
        </label>

        <label className="campo">
          Ano da descoberta
          <input type="number" name="anoDescoberta" value={ficha.anoDescoberta} onChange={handleChange} />
        </label>

        <label className="campo campo-check">
          <input type="checkbox" name="destaque" checked={ficha.destaque} onChange={handleChange} />
          Mostrar em destaque na home
        </label>

        <label className="campo campo-largo">
          Descrição
          <textarea name="descricao" rows="4" value={ficha.descricao} onChange={handleChange} required />
        </label>

        <div className="bloco-curiosidades">
          <div className="bloco-curiosidades-topo">
            <h2>Curiosidades</h2>
            <button type="button" className="botao botao-fantasma" onClick={adicionarCuriosidade}>
              Adicionar curiosidade
            </button>
          </div>
          <p className="bloco-curiosidades-ajuda">
            Opcional. Mínimo de 20 caracteres para salvar cada curiosidade.
          </p>
          {topicos.map((topico, indice) => (
            <div key={topico.localId} className="cartao-curiosidade">
              <label className="campo">
                Categoria {topicos.length > 1 ? indice + 1 : ''}
                <select
                  value={topico.categoria}
                  onChange={(evento) => handleTopico(topico.localId, 'categoria', evento.target.value)}
                >
                  {cfg.topicos.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="botao botao-fantasma"
                onClick={() => removerCuriosidade(topico)}
              >
                Apagar
              </button>
              <label className="campo campo-largo">
                Texto
                <textarea
                  rows="3"
                  value={topico.texto}
                  onChange={(evento) => handleTopico(topico.localId, 'texto', evento.target.value)}
                />
              </label>
            </div>
          ))}
        </div>

        <div className="busca-acoes campo-largo">
          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar ficha'}
          </button>
          <Link to="/dinossauros" className="botao botao-fantasma">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
