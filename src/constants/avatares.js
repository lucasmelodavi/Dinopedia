import { API_URL } from '../services/api'
import trexOculos from '../assets/avatars/trex-oculos.png'
import triceratopsOculos from '../assets/avatars/triceratops-oculos.png'

export const AVATARES = [
  { id: 'trex-oculos', nome: 'T-Rex de óculos', src: trexOculos },
  { id: 'triceratops-oculos', nome: 'Tricerátops de óculos', src: triceratopsOculos },
]

export function iniciais(nome = '') {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export function urlFotoPerfil(usuario) {
  const foto = usuario?.foto
  if (!foto) return usuario?.fotoUrl || null

  if (foto.startsWith('avatar:')) {
    const id = foto.slice('avatar:'.length)
    return AVATARES.find((item) => item.id === id)?.src || null
  }

  if (usuario?.fotoUrl) return usuario.fotoUrl
  if (foto.startsWith('http')) return foto
  if (foto.startsWith('/uploads/')) return `${API_URL}${foto}`
  return null
}
