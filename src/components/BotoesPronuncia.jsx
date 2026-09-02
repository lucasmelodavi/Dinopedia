import { useEffect, useState } from 'react'
import { audioDisponivel, pararPronuncia, prepararMotorVoz, pronunciar } from '../utils/pronuncia'

function IconeSom() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
      <path
        d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function BotoesPronuncia({ nome, nomeCientifico }) {
  const [suportado, setSuportado] = useState(false)
  const [falando, setFalando] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    const ativo = audioDisponivel()
    setSuportado(ativo)

    if (!ativo) return undefined

    prepararMotorVoz()
    return () => pararPronuncia()
  }, [])

  async function ouvir(tipo) {
    setErro('')
    const texto = tipo === 'cientifico' ? nomeCientifico : nome

    if (!String(texto || '').trim()) return

    setFalando(tipo)
    const resultado = await pronunciar(texto, { tipo })

    if (!resultado.ok) {
      setErro('Não foi possível reproduzir a voz neste navegador.')
      setFalando('')
      return
    }

    window.setTimeout(() => setFalando(''), resultado.duracaoMs || 4000)
  }

  if (!suportado) return null

  return (
    <div className="pronuncia-grupo">
      <div className="pronuncia-botoes">
        {nome ? (
          <button
            type="button"
            className={`botao-pronuncia ${falando === 'nome' ? 'is-ativo' : ''}`}
            onClick={() => ouvir('nome')}
            aria-label={`Ouvir pronúncia de ${nome}`}
          >
            <IconeSom />
            Ouvir nome
          </button>
        ) : null}
        {nomeCientifico ? (
          <button
            type="button"
            className={`botao-pronuncia ${falando === 'cientifico' ? 'is-ativo' : ''}`}
            onClick={() => ouvir('cientifico')}
            aria-label={`Ouvir pronúncia de ${nomeCientifico}`}
          >
            <IconeSom />
            Nome científico
          </button>
        ) : null}
      </div>
      {erro ? <p className="pronuncia-erro">{erro}</p> : null}
    </div>
  )
}
