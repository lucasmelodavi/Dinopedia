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
