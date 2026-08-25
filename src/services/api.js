const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || 'http://localhost:3000'
  : ''
const TOKEN_KEY = 'dinopedia_token'
let tokenMemoria = null

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || tokenMemoria
  } catch {
    return tokenMemoria
  }
}

export function setToken(token) {
  tokenMemoria = token || null
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* Safari privado: a sessão fica só nesta aba */
  }
}

export async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {}
  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (!isForm) {
    headers['Content-Type'] = 'application/json'
  }

  const resposta = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body == null ? undefined : isForm ? body : JSON.stringify(body),
  }).catch(() => {
    throw new Error(
      'Não foi possível conectar na API. Se o site estiver na nuvem, aguarde uns segundos e tente de novo (o servidor grátis pode estar acordando).',
    )
  })

  const dados = await resposta.json().catch(() => ({}))

  if (!resposta.ok) {
    const erro = new Error(dados.erro || `Erro ${resposta.status}`)
    erro.status = resposta.status
    erro.email = dados.email
    erro.codigo = dados.codigo
    throw erro
  }

  return dados
}

export { API_URL }
