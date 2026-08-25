import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { ehContaCriador } from '../constants'
import { useAuth } from '../context/AuthContext'
import { deixarDeSeguir, excluirUsuario, listarSeguidores, listarSeguindo, listarUsuarios, seguirUsuario } from '../services/userService'

function CartaoPessoa({ pessoa, autenticado, onSeguir, onExcluir, seguindo, souEu, souCriador, ocupado }) {
  return (
    <article className="cartao-pessoa">
      <Link to={`/usuarios/${pessoa.id}`} className="cartao-pessoa-link">
        <Avatar usuario={pessoa} className="cartao-pessoa-foto" />
        <strong>{pessoa.nome}</strong>
        <small className="cartao-pessoa-pontos">{pessoa.pontos || 0} pts</small>
        {pessoa.criador ? <span className="perfil-badge perfil-badge-criador">Criador</span> : null}
      </Link>
      {souEu ? (
        <span className="perfil-badge">Você</span>
      ) : (
        <div className="cartao-pessoa-acoes">
          {autenticado ? (
            <button
              type="button"
              className={seguindo ? 'botao botao-fantasma' : 'botao'}
              onClick={() => onSeguir(pessoa)}
              disabled={ocupado}
            >
              {seguindo ? 'Seguindo' : 'Seguir'}
            </button>
          ) : (
            <Link to="/login" className="botao">
              Seguir
            </Link>
          )}
          {souCriador && !pessoa.criador ? (
            <button
              type="button"
              className="botao botao-perigo"
              onClick={() => onExcluir(pessoa)}
              disabled={ocupado}
            >
              Excluir
            </button>
          ) : null}
        </div>
      )}
    </article>
  )
}

export default function Amigos() {
  const navigate = useNavigate()
  const { autenticado, usuario } = useAuth()
  const [busca, setBusca] = useState('')
  const [nome, setNome] = useState('')
  const [pessoas, setPessoas] = useState([])
  const [seguindoIds, setSeguindoIds] = useState([])
  const [seguidores, setSeguidores] = useState([])
  const [seguindo, setSeguindo] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(null)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const lista = await listarUsuarios({ nome, limit: 30 })
        if (!ativo) return
        setPessoas(lista.data || [])

        if (autenticado && usuario?.id) {
          const [meusSeguindo, meusSeguidores] = await Promise.all([
            listarSeguindo(usuario.id),
            listarSeguidores(usuario.id),
          ])
          if (!ativo) return
          setSeguindo(meusSeguindo.data || [])
          setSeguidores(meusSeguidores.data || [])
          setSeguindoIds((meusSeguindo.data || []).map((pessoa) => pessoa.id))
        }
      } catch (falha) {
        if (ativo) setErro(falha.message || 'Não foi possível buscar colaboradores.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [nome, autenticado, usuario?.id])

  async function handleSeguir(pessoa) {
    if (!autenticado) {
      navigate('/login')
      return
    }

    const jaSegue = seguindoIds.includes(pessoa.id)
    setOcupado(pessoa.id)
    setErro('')
    try {
      if (jaSegue) {
        await deixarDeSeguir(pessoa.id)
        setSeguindoIds((ids) => ids.filter((id) => id !== pessoa.id))
        setSeguindo((lista) => lista.filter((item) => item.id !== pessoa.id))
      } else {
        await seguirUsuario(pessoa.id)
        setSeguindoIds((ids) => [...ids, pessoa.id])
        setSeguindo((lista) => (lista.some((item) => item.id === pessoa.id) ? lista : [...lista, pessoa]))
      }
    } catch (falha) {
      setErro(falha.message || 'Não foi possível atualizar o seguir.')
    } finally {
      setOcupado(null)
    }
  }

  async function handleExcluir(pessoa) {
    if (!ehContaCriador(usuario) || pessoa.criador) return
    const ok = window.confirm(`Excluir o perfil de ${pessoa.nome}? Essa ação não tem volta.`)
    if (!ok) return

    setOcupado(pessoa.id)
    setErro('')
    try {
      await excluirUsuario(pessoa.id)
      setPessoas((lista) => lista.filter((item) => item.id !== pessoa.id))
      setSeguindo((lista) => lista.filter((item) => item.id !== pessoa.id))
      setSeguidores((lista) => lista.filter((item) => item.id !== pessoa.id))
      setSeguindoIds((ids) => ids.filter((id) => id !== pessoa.id))
    } catch (falha) {
      setErro(falha.message || 'Não foi possível excluir o perfil.')
    } finally {
      setOcupado(null)
    }
  }

  function handleSubmit(evento) {
    evento.preventDefault()
    setNome(busca.trim())
  }

  return (
    <section className="pagina pagina-perfil">
      <h1>Amigos</h1>
      <p>Encontre colaboradores, veja o perfil e siga quem você curte na DinoPédia.</p>

      <form className="formulario busca-amigos" onSubmit={handleSubmit}>
        <label className="campo">
          Buscar por nome
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Ex.: Survivor100"
          />
        </label>
        <button className="botao" type="submit">
          Buscar
        </button>
      </form>

      {erro ? <p className="alerta">{erro}</p> : null}

      <article className="perfil-cartao">
        <div className="perfil-cartao-topo">
          <h2>Colaboradores</h2>
          <span>{carregando ? 'Buscando...' : `${pessoas.length} pessoa(s)`}</span>
        </div>
        {pessoas.length === 0 && !carregando ? (
          <p>Ninguém encontrado. Confirme o e-mail no cadastro para aparecer aqui.</p>
        ) : (
          <div className="grade-pessoas">
            {pessoas.map((pessoa) => (
              <CartaoPessoa
                key={pessoa.id}
                pessoa={pessoa}
                autenticado={autenticado}
                seguindo={seguindoIds.includes(pessoa.id)}
                souEu={usuario?.id === pessoa.id}
                ocupado={ocupado === pessoa.id}
                souCriador={ehContaCriador(usuario)}
                onSeguir={handleSeguir}
                onExcluir={handleExcluir}
              />
            ))}
          </div>
        )}
      </article>

      {autenticado ? (
        <div className="perfil-grade">
          <article className="perfil-cartao">
            <div className="perfil-cartao-topo">
              <h2>Quem você segue</h2>
              <span>{seguindo.length}</span>
            </div>
            {seguindo.length === 0 ? (
              <p>Você ainda não segue ninguém.</p>
            ) : (
              <div className="grade-pessoas">
                {seguindo.map((pessoa) => (
                  <CartaoPessoa
                    key={pessoa.id}
                    pessoa={pessoa}
                    autenticado
                    seguindo
                    ocupado={ocupado === pessoa.id}
                    souCriador={ehContaCriador(usuario)}
                    onSeguir={handleSeguir}
                    onExcluir={handleExcluir}
                  />
                ))}
              </div>
            )}
          </article>

          <article className="perfil-cartao">
            <div className="perfil-cartao-topo">
              <h2>Seus seguidores</h2>
              <span>{seguidores.length}</span>
            </div>
            {seguidores.length === 0 ? (
              <p>Ninguém te segue ainda.</p>
            ) : (
              <div className="grade-pessoas">
                {seguidores.map((pessoa) => (
                  <CartaoPessoa
                    key={pessoa.id}
                    pessoa={pessoa}
                    autenticado
                    seguindo={seguindoIds.includes(pessoa.id)}
                    ocupado={ocupado === pessoa.id}
                    souCriador={ehContaCriador(usuario)}
                    onSeguir={handleSeguir}
                    onExcluir={handleExcluir}
                  />
                ))}
              </div>
            )}
          </article>
        </div>
      ) : (
        <p>
          <Link to="/login">Entre</Link> para seguir amigos e ver sua lista.
        </p>
      )}
    </section>
  )
}
