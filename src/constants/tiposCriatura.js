import { FAMILIAS } from './familias'

export const TIPOS_CRIATURA = [
  {
    id: 'dinossauro',
    nome: 'Dinossauro',
    simbolo: '🦕',
    periodos: ['Triássico', 'Jurássico', 'Cretáceo'],
    grupos: FAMILIAS,
    rotuloGrupo: 'Família',
    rotuloFoto: 'Foto do dinossauro',
    rotuloTamanho: 'Comprimento (m)',
    dietaObrigatoria: true,
    topicos: ['Alimentação', 'Fósseis', 'Comportamento', 'Aparência física', 'Curiosidade'],
  },
  {
    id: 'pterossauro',
    nome: 'Pterossauro',
    simbolo: '🦅',
    periodos: ['Triássico', 'Jurássico', 'Cretáceo'],
    grupos: ['Pterodactiloide', 'Azhdarchidae', 'Tapejaridae', 'Anurognathidae', 'Dimorphodontidae', 'Outro'],
    rotuloGrupo: 'Grupo',
    rotuloFoto: 'Foto do pterossauro',
    rotuloTamanho: 'Comprimento (m)',
    dietaObrigatoria: true,
    modosVoo: ['Planador', 'Voo ativo', 'Ambos', 'Desconhecido'],
    topicos: ['Voo', 'Habitat', 'Crânio e bico', 'Fósseis', 'Curiosidade'],
  },
  {
    id: 'reptil_marinho',
    nome: 'Réptil marinho',
    simbolo: '🌊',
    periodos: ['Triássico', 'Jurássico', 'Cretáceo'],
    grupos: ['Plesiossauro', 'Ictiossauro', 'Mosassauro', 'Placodonte', 'Nothossauro', 'Outro'],
    rotuloGrupo: 'Grupo',
    rotuloFoto: 'Foto do réptil marinho',
    rotuloTamanho: 'Comprimento (m)',
    dietaObrigatoria: true,
    habitats: ['Mar aberto', 'Costeiro', 'Estuário', 'Desconhecido'],
    topicos: ['Nadadeiras', 'Respiração', 'Presas', 'Fósseis', 'Curiosidade'],
  },
  {
    id: 'mamifero',
    nome: 'Mamífero',
    simbolo: '🐘',
    periodos: ['Paleógeno', 'Neógeno', 'Pleistoceno', 'Holoceno'],
    grupos: ['Proboscidea', 'Felidae', 'Perissodactyla', 'Artiodactyla', 'Primates', 'Carnivora', 'Outro'],
    rotuloGrupo: 'Ordem / família',
    rotuloFoto: 'Foto do mamífero',
    rotuloTamanho: 'Comprimento (m)',
    dietaObrigatoria: true,
    pelagens: ['Sim', 'Não', 'Desconhecido'],
    topicos: ['Habitat', 'Extinção', 'Comportamento', 'Dentes e garras', 'Curiosidade'],
  },
  {
    id: 'outro',
    nome: 'Outro animal',
    simbolo: '🦎',
    periodos: ['Triássico', 'Jurássico', 'Cretáceo', 'Paleógeno', 'Neógeno', 'Pleistoceno', 'Holoceno', 'Outro'],
    grupos: ['Anfíbio', 'Peixe', 'Artrópode', 'Ave primitiva', 'Outro'],
    rotuloGrupo: 'Categoria',
    rotuloFoto: 'Foto do animal',
    rotuloTamanho: 'Tamanho (texto livre)',
    dietaObrigatoria: false,
    topicos: ['Habitat', 'Fósseis', 'Comportamento', 'Aparência', 'Curiosidade'],
  },
]

export function configTipo(id) {
  return TIPOS_CRIATURA.find((tipo) => tipo.id === id) || TIPOS_CRIATURA[0]
}

export function rotuloTipo(id) {
  return configTipo(id).nome
}

export function todasCategoriasTopico() {
  const lista = new Set()
  TIPOS_CRIATURA.forEach((tipo) => tipo.topicos.forEach((item) => lista.add(item)))
  return [...lista]
}

export function fichaVazia(tipo = 'dinossauro') {
  const cfg = configTipo(tipo)
  return {
    tipo,
    nome: '',
    nomeCientifico: '',
    periodo: cfg.periodos[cfg.periodos.length - 1] || 'Cretáceo',
    dieta: cfg.dietaObrigatoria ? 'Carnívoro' : 'Não informado',
    grupo: '',
    descricao: '',
    comprimento: '',
    regiao: '',
    anoDescoberta: '',
    destaque: false,
    envergura: '',
    modoVoo: cfg.modosVoo?.[0] || '',
    habitat: cfg.habitats?.[0] || '',
    peso: '',
    pelagem: cfg.pelagens?.[1] || 'Não',
    tamanho: '',
  }
}

export function montarPayload(ficha) {
  const cfg = configTipo(ficha.tipo)
  const atributos = {}
  if (ficha.tipo === 'pterossauro') {
    if (ficha.envergura !== '') atributos.envergura = Number(ficha.envergura)
    if (ficha.modoVoo) atributos.modoVoo = ficha.modoVoo
  }
  if (ficha.tipo === 'reptil_marinho' && ficha.habitat) {
    atributos.habitat = ficha.habitat
  }
  if (ficha.tipo === 'mamifero') {
    if (ficha.peso !== '') atributos.peso = Number(ficha.peso)
    if (ficha.pelagem) atributos.pelagem = ficha.pelagem
  }
  if (ficha.tipo === 'outro' && ficha.tamanho) {
    atributos.tamanho = ficha.tamanho.trim()
  }

  return {
    tipo: ficha.tipo,
    nome: ficha.nome.trim(),
    nomeCientifico: ficha.nomeCientifico.trim(),
    periodo: ficha.periodo,
    dieta: ficha.dieta,
    familia: ficha.grupo || undefined,
    descricao: ficha.descricao.trim(),
    comprimento: ficha.comprimento === '' ? undefined : Number(ficha.comprimento),
    regiao: ficha.regiao.trim() || undefined,
    anoDescoberta: ficha.anoDescoberta === '' ? undefined : Number(ficha.anoDescoberta),
    destaque: ficha.destaque,
    atributos,
  }
}

export function fichaDoServidor(dino) {
  const attrs = dino.atributos || {}
  return {
    ...fichaVazia(dino.tipo || 'dinossauro'),
    tipo: dino.tipo || 'dinossauro',
    nome: dino.nome || '',
    nomeCientifico: dino.nomeCientifico || '',
    periodo: dino.periodo || 'Cretáceo',
    dieta: dino.dieta || 'Carnívoro',
    grupo: dino.familia || '',
    descricao: dino.descricao || '',
    comprimento: dino.comprimento ?? '',
    regiao: dino.regiao || '',
    anoDescoberta: dino.anoDescoberta ?? '',
    destaque: Boolean(dino.destaque),
    envergura: attrs.envergura ?? '',
    modoVoo: attrs.modoVoo || '',
    habitat: attrs.habitat || '',
    peso: attrs.peso ?? '',
    pelagem: attrs.pelagem || '',
    tamanho: attrs.tamanho || '',
  }
}
