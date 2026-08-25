import { request } from './api'

export function registrar(dados) {
  return request('/auth/register', { method: 'POST', body: dados })
}

export function login(dados) {
  return request('/auth/login', { method: 'POST', body: dados })
}

export function confirmarEmail(dados) {
  return request('/auth/confirmar', { method: 'POST', body: dados })
}

export function reenviarCodigo(dados) {
  return request('/auth/reenviar-codigo', { method: 'POST', body: dados })
}

export function getPerfil() {
  return request('/auth/perfil')
}

export function escolherAvatar(avatar) {
  return request('/auth/perfil', { method: 'PUT', body: { avatar } })
}

export function atualizarDescricao(descricao) {
  return request('/auth/perfil', { method: 'PUT', body: { descricao } })
}

export function atualizarEnfeites(enfeites) {
  return request('/auth/perfil', { method: 'PUT', body: { enfeites } })
}

export function enviarFotoPerfil(arquivo) {
  const form = new FormData()
  form.append('foto', arquivo)
  return request('/auth/perfil/foto', { method: 'POST', body: form, isForm: true })
}
