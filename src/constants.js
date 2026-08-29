export const PERIODOS = ['Triássico', 'Jurássico', 'Cretáceo']

export const PERIODOS_TODOS = [
  ...PERIODOS,
  'Paleógeno',
  'Neógeno',
  'Pleistoceno',
  'Holoceno',
  'Outro',
]

export const DIETAS = ['Carnívoro', 'Herbívoro', 'Onívoro', 'Não informado']

export const CATEGORIAS_TOPICO = [
  'Alimentação',
  'Fósseis',
  'Comportamento',
  'Curiosidade',
  'Aparência física',
  'Voo',
  'Habitat',
  'Crânio e bico',
  'Nadadeiras',
  'Respiração',
  'Presas',
  'Extinção',
  'Dentes e garras',
  'Aparência',
]

export { TIPOS_CRIATURA, configTipo, rotuloTipo, fichaVazia, montarPayload, fichaDoServidor } from './constants/tiposCriatura'

export const FAMILIAS = [
  'Theropoda',
  'Spinosauridae',
  'Abelisauridae',
  'Herrerasauridae',
  'Plateosauridae',
  'Sauropoda',
  'Titanosauria',
  'Ceratopsia',
  'Ankylosauria',
  'Stegosauria',
  'Hadrosauridae',
  'Ornithischia',
]

export const EMAIL_CRIADOR = 'lucasmelodavi425@gmail.com'

export const REGRAS_PONTOS = [
  { pontos: 50, label: 'Cadastrar um dinossauro' },
  { pontos: 20, label: 'Adicionar um tópico' },
  { pontos: 15, label: 'Enviar foto da ficha' },
  { pontos: 10, label: 'Editar uma ficha (1 vez por dia em cada dino)' },
  { pontos: 10, label: 'Colocar foto ou avatar no perfil' },
  { pontos: 10, label: 'Escrever a descrição do perfil' },
  { pontos: 10, label: 'Confirmar a conta' },
]

export function ehContaCriador(usuario) {
  return String(usuario?.email || '').trim().toLowerCase() === EMAIL_CRIADOR
}
