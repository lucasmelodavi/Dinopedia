import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIAS_TOPICO, DIETAS, FAMILIAS, PERIODOS } from '../constants'
import { useAuth } from '../context/AuthContext'
import {
  atualizarDinossauro,
  buscarDinossauro,
  criarDinossauro,
  criarTopico,
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

export default function CadastroDinossauro() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()
  const { autenticado, carregando } = useAuth()
  const [ficha, setFicha] = useState(VAZIO)
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [topicoCategoria, setTopicoCategoria] = useState(CATEGORIAS_TOPICO[4])
  const [topicoTexto, setTopicoTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!editando) return

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
      const resposta = editando
        ? await atualizarDinossauro(id, dados)
        : await criarDinossauro(dados)

      const criado = resposta.dinossauro
      const dinoId = criado?.id || id

      if (foto && dinoId) {
        await enviarFoto(dinoId, foto)
      }

      if (!editando && topicoTexto.trim().length >= 20 && dinoId) {
        await criarTopico(dinoId, {
          categoria: topicoCategoria,
          texto: topicoTexto.trim(),
        })
      }

      navigate(`/dinossauros/${dinoId}`)
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
        Preencha a ficha como nos cards da home: nome, nome científico, período,
        dieta e uma foto.
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
          <input name="regiao" value={ficha.regiao} onChange={handleChange} />
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

        {!editando ? (
          <>
            <label className="campo">
              Categoria da curiosidade
              <select
                value={topicoCategoria}
                onChange={(evento) => setTopicoCategoria(evento.target.value)}
              >
                {CATEGORIAS_TOPICO.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo campo-largo">
              Curiosidade (opcional, mínimo 20 caracteres)
              <textarea
                rows="3"
                value={topicoTexto}
                onChange={(evento) => setTopicoTexto(evento.target.value)}
                placeholder="Uma curiosidade sobre fósseis, alimentação ou aparência."
              />
            </label>
          </>
        ) : null}

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
