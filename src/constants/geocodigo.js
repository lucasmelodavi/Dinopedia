function semAcento(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const LOCAIS = [
  { chaves: ['hell creek', 'dakota do norte', 'dakota do sul'], lat: 47.6, lng: -104.5 },
  { chaves: ['morrison', 'colorado', 'utah', 'wyoming'], lat: 39.7, lng: -107.5 },
  { chaves: ['montana'], lat: 47.0, lng: -109.6 },
  { chaves: ['alberta', 'canada'], lat: 53.9, lng: -110.5 },
  { chaves: ['texas'], lat: 31.5, lng: -99.3 },
  { chaves: ['estados unidos', 'eua', 'usa', 'america do norte'], lat: 39.8, lng: -98.6 },
  { chaves: ['mexico', 'coahuila'], lat: 27.3, lng: -102.0 },
  { chaves: ['patagonia', 'neuquen', 'chubut', 'santa cruz'], lat: -43.3, lng: -68.5 },
  { chaves: ['argentina', 'vale da lua'], lat: -38.4, lng: -63.6 },
  { chaves: ['chile'], lat: -35.7, lng: -71.5 },
  { chaves: ['brasil', 'minas gerais', 'maranhao', 'ceara'], lat: -14.2, lng: -51.9 },
  { chaves: ['deserto de gobi', 'gobi', 'mongolia'], lat: 43.5, lng: 104.0 },
  { chaves: ['liaoning', 'china'], lat: 35.9, lng: 104.2 },
  { chaves: ['india'], lat: 21.1, lng: 78.0 },
  { chaves: ['marrocos', 'kem kem'], lat: 30.9, lng: -4.4 },
  { chaves: ['egito', 'bahariya'], lat: 26.8, lng: 30.8 },
  { chaves: ['africa do sul'], lat: -28.5, lng: 24.7 },
  { chaves: ['tanzania', 'tendaguru'], lat: -9.5, lng: 39.1 },
  { chaves: ['madagascar'], lat: -19.4, lng: 46.7 },
  { chaves: ['saara', 'africa'], lat: 18.0, lng: 9.0 },
  { chaves: ['inglaterra', 'reino unido', 'ilha de wight'], lat: 52.4, lng: -1.5 },
  { chaves: ['alemanha', 'solnhofen'], lat: 51.2, lng: 10.4 },
  { chaves: ['franca'], lat: 46.2, lng: 2.2 },
  { chaves: ['espanha', 'portugal'], lat: 40.0, lng: -4.5 },
  { chaves: ['europa'], lat: 50.0, lng: 10.0 },
  { chaves: ['australia', 'queensland'], lat: -25.3, lng: 133.8 },
  { chaves: ['antartida', 'antartica'], lat: -78.0, lng: 20.0 },
]

const NOMES = [
  { chaves: ['eoraptor'], lat: -29.8, lng: -67.9 },
  { chaves: ['tiranossauro', 'tyrannosaurus'], lat: 47.6, lng: -104.5 },
  { chaves: ['estegossauro', 'stegosaurus'], lat: 39.7, lng: -107.5 },
  { chaves: ['triceratopo', 'triceratops'], lat: 47.6, lng: -104.5 },
  { chaves: ['velociraptor'], lat: 43.5, lng: 104.0 },
  { chaves: ['espinossauro', 'spinosaurus'], lat: 30.9, lng: -4.4 },
  { chaves: ['braquiossauro', 'brachiosaurus'], lat: 39.7, lng: -107.5 },
  { chaves: ['argentinossauro', 'argentinosaurus'], lat: -38.9, lng: -68.1 },
  { chaves: ['giganotossauro', 'giganotosaurus'], lat: -39.0, lng: -69.2 },
  { chaves: ['carnotauro', 'carnotaurus'], lat: -42.9, lng: -71.1 },
  { chaves: ['ankilossauro', 'ankylosaurus'], lat: 47.6, lng: -104.5 },
  { chaves: ['diplodoco', 'diplodocus'], lat: 39.7, lng: -107.5 },
  { chaves: ['alossauro', 'allosaurus'], lat: 39.7, lng: -107.5 },
  { chaves: ['iguanodonte', 'iguanodon'], lat: 50.8, lng: 4.4 },
  { chaves: ['dilofossauro', 'dilophosaurus'], lat: 35.8, lng: -111.5 },
  { chaves: ['parassaurolofo', 'parasaurolophus'], lat: 51.4, lng: -112.6 },
  { chaves: ['brontossauro', 'brontosaurus', 'apatossauro', 'apatosaurus'], lat: 39.7, lng: -107.5 },
  { chaves: ['compsognato', 'compsognathus'], lat: 48.9, lng: 11.0 },
]

function peloLista(lista, valor) {
  const texto = semAcento(valor)
  if (!texto) return null
  let melhor = null
  let tamanho = 0
  for (const local of lista) {
    for (const item of local.chaves) {
      const termo = semAcento(item)
      if (termo.length < 4) continue
      if (texto === termo || texto.includes(termo)) {
        if (termo.length >= tamanho) {
          melhor = local
          tamanho = termo.length
        }
      }
    }
  }
  return melhor ? { lat: melhor.lat, lng: melhor.lng } : null
}

export function localizarFicha(dino) {
  return (
    peloLista(LOCAIS, dino?.regiao) ||
    peloLista(NOMES, dino?.nome) ||
    peloLista(NOMES, dino?.nomeCientifico) ||
    peloLista(LOCAIS, `${dino?.nome || ''} ${dino?.nomeCientifico || ''}`)
  )
}

export function espalharPontos(pontos) {
  const grupos = new Map()
  pontos.forEach((ponto, indice) => {
    const chave = `${Number(ponto.lat).toFixed(1)}:${Number(ponto.lng).toFixed(1)}`
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave).push(indice)
  })

  const saida = pontos.map((ponto) => ({ ...ponto }))
  grupos.forEach((indices) => {
    if (indices.length < 2) return
    indices.forEach((indice, ordem) => {
      const angulo = (ordem / indices.length) * Math.PI * 2
      const raio = 2.4
      saida[indice] = {
        ...saida[indice],
        lat: Number(saida[indice].lat) + Math.sin(angulo) * raio,
        lng: Number(saida[indice].lng) + Math.cos(angulo) * raio,
      }
    })
  })
  return saida
}

export function pontosDasFichas(fichas = [], preferidos = []) {
  const porId = new Map()

  preferidos.forEach((ponto) => {
    if (Number.isFinite(Number(ponto.lat)) && Number.isFinite(Number(ponto.lng))) {
      porId.set(Number(ponto.id), ponto)
    }
  })

  fichas.forEach((dino) => {
    const id = Number(dino.id)
    if (porId.has(id)) return
    const ponto = localizarFicha(dino)
    if (!ponto) return
    porId.set(id, {
      id: dino.id,
      nome: dino.nome,
      fotoUrl: dino.fotoUrl,
      regiao: dino.regiao || '',
      lat: ponto.lat,
      lng: ponto.lng,
    })
  })

  return espalharPontos([...porId.values()])
}
