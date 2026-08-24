export const PERIODOS = ['Triássico', 'Jurássico', 'Cretáceo']

export const DIETAS = ['Carnívoro', 'Herbívoro', 'Onívoro']

export const CATEGORIAS_TOPICO = [
  'Alimentação',
  'Fósseis',
  'Comportamento',
  'Curiosidade',
  'Aparência física',
]

export const FAMILIAS = [
  'Theropoda',
  'Spinosauridae',
  'Sauropoda',
  'Titanosauria',
  'Ceratopsia',
  'Ankylosauria',
  'Stegosauria',
  'Hadrosauridae',
  'Ornithischia',
]

export const EMAIL_CRIADOR = 'lucasmelodavi425@gmail.com'

export function ehContaCriador(usuario) {
  return String(usuario?.email || '').trim().toLowerCase() === EMAIL_CRIADOR
}
