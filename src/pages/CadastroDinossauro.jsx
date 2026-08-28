import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIAS_TOPICO, DIETAS, FAMILIAS, PERIODOS } from '../constants'
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

const VAZIO = {
  nome: '',
  nomeCientifico: '',
  periodo: 'Cretáceo',
  dieta: 'Carnívoro',
  familia: '',
  descricao: '',
  comprimento: '',
  regiao: '',
  anoDescoberta: '',
  destaque: false,
}

function novaCuriosidade() {
  return {
    localId: `novo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: null,
    categoria: 'Curiosidade',
    texto: '',
  }
}

export default function CadastroDinossauro() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()
  const { autenticado, carregando, atualizarUsuario } = useAuth()
  const [ficha, setFicha] = useState(VAZIO)
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [topicos, setTopicos] = useState([novaCuriosidade()])
  const [topicosRemovidos, setTopicosRemovidos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!editando) {
      setTopicos([novaCuriosidade()])
      setTopicosRemovidos([])
      return
    }

    buscarDinossauro(id)
      .then((dino) => {
        setFicha({
          nome: dino.nome || '',
          nomeCientifico: dino.nomeCientifico || '',
          periodo: dino.periodo || 'Cretáceo',
          dieta: dino.dieta || 'Carnívoro',
          familia: dino.familia || '',
          descricao: dino.descricao || '',
          comprimento: dino.comprimento ?? '',
          regiao: dino.regiao || '',
          anoDescoberta: dino.anoDescoberta ?? '',
          destaque: Boolean(dino.destaque),
        })
        if (dino.fotoUrl) setPreview(dino.fotoUrl)
        const existentes = (dino.topicos || []).map((topico) => ({
          localId: `salvo-${topico.id}`,
          id: topico.id,
          categoria: topico.categoria || 'Curiosidade',
          texto: topico.texto || '',
        }))
        setTopicos(existentes.length ? existentes : [novaCuriosidade()])
        setTopicosRemovidos([])
      })
      .catch((falha) => setErro(falha.message || 'Não foi possível carregar a ficha.'))
  }, [editando, id])

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
    setTopicos((atual) => [...atual, novaCuriosidade()])
  }

  function removerCuriosidade(topico) {
    if (topico.id) {
      setTopicosRemovidos((atual) => [...atual, topico.id])
    }
    setTopicos((atual) => {
      const resto = atual.filter((item) => item.localId !== topico.localId)
      return resto.length ? resto : [novaCuriosidade()]
    })
  }

  async function handleSubmit(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)

    const dados = {
      nome: ficha.nome.trim(),
      nomeCientifico: ficha.nomeCientifico.trim(),
      periodo: ficha.periodo,
      dieta: ficha.dieta,
      familia: ficha.familia || undefined,
      descricao: ficha.descricao.trim(),
      comprimento: ficha.comprimento === '' ? undefined : Number(ficha.comprimento),
      regiao: ficha.regiao.trim() || undefined,
      anoDescoberta: ficha.anoDescoberta === '' ? undefined : Number(ficha.anoDescoberta),
      destaque: ficha.destaque,
    }

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
      setErro(falha.message || 'Não foi possível salvar o dinossauro.')
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
        <h1>Adicionar dinossauro</h1>
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

  return (
    <section className="pagina">
      <h1>{editando ? 'Editar dinossauro' : 'Adicionar dinossauro'}</h1>
      <p>
        {editando
          ? 'Altere a ficha e as curiosidades: alimentação, fósseis, comportamento e aparência.'
          : 'Preencha a ficha como nos cards da home: nome, nome científico, período, dieta e uma foto.'}
      </p>

      <form className="formulario form-ficha cartao" onSubmit={handleSubmit}>
        {erro ? <p className="alerta">{erro}</p> : null}

        <label className="campo campo-foto">
          Foto do dinossauro
          {preview ? (
            <img src={preview} alt="Prévia" className="preview-foto" />
          ) : (
            <span className="preview-foto preview-foto--vazia">Sem foto ainda</span>
          )}
          <input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleFoto} />
        </label>

        <label className="campo">
          Nome
          <input
            name="nome"
            value={ficha.nome}
            onChange={handleChange}
            placeholder="Tiranossauro rex"
            required
          />
        </label>

        <label className="campo">
          Nome científico
          <input
            name="nomeCientifico"
            value={ficha.nomeCientifico}
            onChange={handleChange}
            placeholder="Tyrannosaurus rex"
            required
          />
        </label>

        <label className="campo">
          Período
          <select name="periodo" value={ficha.periodo} onChange={handleChange} required>
            {PERIODOS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          Dieta
          <select name="dieta" value={ficha.dieta} onChange={handleChange} required>
            {DIETAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          Família
          <select name="familia" value={ficha.familia} onChange={handleChange}>
            <option value="">Não informar</option>
            {FAMILIAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          Comprimento (metros)
          <input
            type="number"
            name="comprimento"
            min="0"
            step="0.1"
            value={ficha.comprimento}
            onChange={handleChange}
          />
        </label>

        <label className="campo">
          Região
          <input
            name="regiao"
            value={ficha.regiao}
            onChange={handleChange}
            placeholder="Ex: Argentina, Montana, Deserto de Gobi"
          />
          <small className="campo-ajuda">
            O mapa da home coloca o balão sozinho neste lugar, com a foto da ficha.
          </small>
        </label>

        <label className="campo">
          Ano da descoberta
          <input
            type="number"
            name="anoDescoberta"
            value={ficha.anoDescoberta}
            onChange={handleChange}
          />
        </label>

        <label className="campo campo-check">
          <input
            type="checkbox"
            name="destaque"
            checked={ficha.destaque}
            onChange={handleChange}
          />
          Mostrar em “Dinossauros em destaque”
        </label>

        <label className="campo campo-largo">
          Descrição
          <textarea
            name="descricao"
            rows="4"
            value={ficha.descricao}
            onChange={handleChange}
            required
          />
        </label>

        <div className="bloco-curiosidades">
          <div className="bloco-curiosidades-topo">
            <h2>Curiosidades</h2>
            <button type="button" className="botao botao-fantasma" onClick={adicionarCuriosidade}>
              Adicionar curiosidade
            </button>
          </div>
          <p className="bloco-curiosidades-ajuda">
            {editando
              ? 'Edite o texto, troque a categoria ou apague. Também dá para incluir uma nova.'
              : 'Opcional. Mínimo de 20 caracteres para salvar cada curiosidade.'}
          </p>
          {topicos.map((topico, indice) => (
            <div key={topico.localId} className="cartao-curiosidade">
              <label className="campo">
                Categoria {topicos.length > 1 ? indice + 1 : ''}
                <select
                  value={topico.categoria}
                  onChange={(evento) => handleTopico(topico.localId, 'categoria', evento.target.value)}
                >
                  {CATEGORIAS_TOPICO.map((item) => (
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
                  placeholder="Uma curiosidade sobre fósseis, alimentação ou aparência."
                />
              </label>
            </div>
          ))}
        </div>

        <div className="busca-acoes campo-largo">
          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar dinossauro'}
          </button>
          <Link to="/dinossauros" className="botao botao-fantasma">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
