import { request } from './api'

export function listarUsuarios(filtros = {}) {
  const params = new URLSearchParams()

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== '') {
      params.set(chave, valor)
    }
  })

  const query = params.toString()
  return request(`/usuarios${query ? `?${query}` : ''}`)
}

export function buscarUsuario(id) {
  return request(`/usuarios/${id}`)
}

export function seguirUsuario(id) {
  return request(`/usuarios/${id}/seguir`, { method: 'POST' })
}

export function deixarDeSeguir(id) {
  return request(`/usuarios/${id}/seguir`, { method: 'DELETE' })
}

export function listarSeguidores(id) {
  return request(`/usuarios/${id}/seguidores`)
}

export function listarSeguindo(id) {
  return request(`/usuarios/${id}/seguindo`)
}

export function excluirUsuario(id) {
  return request(`/usuarios/${id}`, { method: 'DELETE' })
}

export function listarRanking(limit = 20) {
  return request(`/usuarios/ranking?limit=${limit}`)
}
