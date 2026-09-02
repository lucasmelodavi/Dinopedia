const PRESETS = {
  nome: {
    chave: 'nome',
    idioma: 'pt-BR',
    rate: 0.74,
    pitch: 0.88,
    pausaEntreTrechos: 240,
    pausaInicial: 120,
    preferencias: [
      'antonio',
      'felipe',
      'daniel',
      'google português do brasil',
      'google portuguese',
      'guy',
      'microsoft antonio',
    ],
    bonusMasculino: true,
  },
  cientifico: {
    chave: 'cientifico',
    idioma: 'en-GB',
    idiomasFallback: ['en-US'],
    rate: 0.66,
    pitch: 0.82,
    pausaEntreTrechos: 360,
    pausaInicial: 160,
    preferencias: [
      'daniel',
      'ryan',
      'arthur',
      'google uk english male',
      'microsoft ryan',
      'guy',
      'microsoft guy',
      'google us english',
      'david',
    ],
    bonusMasculino: true,
  },
}

const VOZES_MASCULINAS = [
  'antonio',
  'felipe',
  'daniel',
  'guy',
  'ryan',
  'arthur',
  'david',
  'james',
  'mark',
]

const cacheVozes = new Map()
let vozesCarregadas = null
let carregamento = null

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function pontuarVoz(voz, preset) {
  const nome = normalizar(voz.name)
  const lang = voz.lang.toLowerCase()
  const alvo = preset.idioma.toLowerCase()
  const base = alvo.split('-')[0]

  if (!lang.startsWith(base)) return -100

  let pontos = 0

  if (lang === alvo) pontos += 20
  else if (lang.startsWith(base)) pontos += 10

  preset.preferencias.forEach((preferida, indice) => {
    if (nome.includes(preferida)) {
      pontos += 44 - indice * 2
    }
  })

  if (nome.includes('natural')) pontos += 26
  if (nome.includes('neural')) pontos += 26
  if (nome.includes('online')) pontos += 12
  if (nome.includes('google')) pontos += 18
  if (nome.includes('microsoft')) pontos += 10
  if (voz.localService === false) pontos += 6

  if (preset.bonusMasculino && VOZES_MASCULINAS.some((item) => nome.includes(item))) {
    pontos += 16
  }

  if (nome.includes('compact')) pontos -= 20
  if (nome.includes('espeak')) pontos -= 35
  if (nome.includes('default')) pontos -= 10

  return pontos
}

function escolherMelhorVoz(vozes, preset) {
  if (cacheVozes.has(preset.chave)) return cacheVozes.get(preset.chave)

  const idiomas = [preset.idioma, ...(preset.idiomasFallback || [])]
  let melhor = null
  let melhorPontos = -1

  idiomas.forEach((idioma) => {
    const presetIdioma = { ...preset, idioma }
    const ordenadas = vozes
      .map((voz) => ({ voz, pontos: pontuarVoz(voz, presetIdioma) }))
      .filter((item) => item.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos)

    if (ordenadas[0] && ordenadas[0].pontos > melhorPontos) {
      melhor = ordenadas[0].voz
      melhorPontos = ordenadas[0].pontos
    }
  })

  cacheVozes.set(preset.chave, melhor)
  return melhor
}

function carregarVozes() {
  if (vozesCarregadas?.length) {
    return Promise.resolve(vozesCarregadas)
  }

  if (carregamento) return carregamento

  carregamento = new Promise((resolve) => {
    let resolvido = false

    const finalizar = () => {
      if (resolvido) return
      resolvido = true
      vozesCarregadas = window.speechSynthesis.getVoices()
      carregamento = null
      resolve(vozesCarregadas)
    }

    const atuais = window.speechSynthesis.getVoices()
    if (atuais.length) {
      finalizar()
      return
    }

    window.speechSynthesis.onvoiceschanged = finalizar
    window.setTimeout(finalizar, 600)
    window.setTimeout(finalizar, 1400)
  })

  return carregamento
}

function prepararNomeComum(texto) {
  return String(texto || '').replace(/\s+/g, ' ').trim()
}

function prepararNomeCientifico(texto) {
  return String(texto || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function partesNomeCientifico(texto) {
  const palavras = prepararNomeCientifico(texto).split(' ').filter(Boolean)
  if (palavras.length <= 1) return palavras
  if (palavras.length === 2) return palavras
  return [palavras[0], palavras.slice(1).join(' ')]
}

function falarTrecho(texto, preset) {
  return new Promise((resolve) => {
    const fala = new SpeechSynthesisUtterance(texto)
    const voz = escolherMelhorVoz(vozesCarregadas || [], preset)

    fala.lang = voz?.lang || preset.idioma
    fala.rate = preset.rate
    fala.pitch = preset.pitch
    fala.volume = 1
    if (voz) fala.voice = voz

    fala.onend = () => resolve(true)
    fala.onerror = () => resolve(false)
    window.speechSynthesis.speak(fala)
  })
}

function esperar(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function formatarNomeVoz(voz) {
  if (!voz) return null

  return voz.name
    .replace(/Microsoft\s+/i, '')
    .replace(/Google\s+/i, '')
    .replace(/\s*Online\s*\(Natural\)/i, ' Natural')
    .replace(/\s*-\s*Portuguese.*/i, '')
    .replace(/\s*-\s*English.*/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim()
}

export function audioDisponivel() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export async function prepararMotorVoz() {
  if (!audioDisponivel()) return false

  window.speechSynthesis.getVoices()
  const vozes = await carregarVozes()
  cacheVozes.clear()
  escolherMelhorVoz(vozes, PRESETS.nome)
  escolherMelhorVoz(vozes, PRESETS.cientifico)
  return true
}

export function nomeDaVoz(tipo = 'nome') {
  const preset = PRESETS[tipo] || PRESETS.nome
  const voz = cacheVozes.get(preset.chave) || escolherMelhorVoz(vozesCarregadas || [], preset)
  return formatarNomeVoz(voz)
}

export async function pronunciar(texto, { tipo = 'nome' } = {}) {
  if (!audioDisponivel()) return { ok: false, duracaoMs: 0 }

  await prepararMotorVoz()
  window.speechSynthesis.cancel()
  await esperar(50)

  const preset = PRESETS[tipo] || PRESETS.nome
  const cientifico = tipo === 'cientifico'
  const limpo = cientifico ? prepararNomeCientifico(texto) : prepararNomeComum(texto)
  if (!limpo) return { ok: false, duracaoMs: 0 }

  await esperar(preset.pausaInicial)

  const trechos = cientifico ? partesNomeCientifico(limpo) : [limpo]
  let ok = true

  for (let indice = 0; indice < trechos.length; indice += 1) {
    if (!trechos[indice]) continue
    const falou = await falarTrecho(trechos[indice], preset)
    ok = ok && falou
    if (indice < trechos.length - 1) {
      await esperar(preset.pausaEntreTrechos)
    }
  }

  const duracaoMs = Math.min(
    14000,
    preset.pausaInicial +
      trechos.join(' ').length * (cientifico ? 165 : 130) +
      trechos.length * preset.pausaEntreTrechos,
  )

  return { ok, duracaoMs, voz: nomeDaVoz(tipo) }
}

export function pararPronuncia() {
  if (audioDisponivel()) {
    window.speechSynthesis.cancel()
  }
}
