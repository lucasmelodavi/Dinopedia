import { request } from './api'

export function listarDinossauros(filtros = {}) {
  const params = new URLSearchParams()

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== '') {
      params.set(chave, valor)
    }
  })

  const query = params.toString()
  return request(`/dinossauros${query ? `?${query}` : ''}`)
}

export function listarDestaques() {
  return request('/dinossauros/destaques')
}

export function getLinhaDoTempo() {
  return request('/linha-do-tempo')
}

export function buscarDinossauro(id) {
  return request(`/dinossauros/${id}`)
}

export function criarDinossauro(dados) {
  return request('/dinossauros', { method: 'POST', body: dados })
}

export function atualizarDinossauro(id, dados) {
  return request(`/dinossauros/${id}`, { method: 'PUT', body: dados })
}

export function deletarDinossauro(id) {
  return request(`/dinossauros/${id}`, { method: 'DELETE' })
}

export function enviarFoto(id, arquivo) {
  const form = new FormData()
  form.append('foto', arquivo)
  return request(`/dinossauros/${id}/foto`, { method: 'POST', body: form, isForm: true })
}

export function listarTopicos(id) {
  return request(`/dinossauros/${id}/topicos`)
}

export function criarTopico(id, dados) {
  return request(`/dinossauros/${id}/topicos`, { method: 'POST', body: dados })
}

export function atualizarTopico(id, topicoId, dados) {
  return request(`/dinossauros/${id}/topicos/${topicoId}`, { method: 'PUT', body: dados })
}

export function deletarTopico(id, topicoId) {
  return request(`/dinossauros/${id}/topicos/${topicoId}`, { method: 'DELETE' })
}

export function getOpcoes() {
  return request('/opcoes')
}
