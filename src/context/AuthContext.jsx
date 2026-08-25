import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getToken, setToken } from '../services/api'
import { getPerfil, login as loginApi } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setCarregando(false)
      return
    }

    getPerfil()
      .then((dados) => setUsuario(dados))
      .catch((falha) => {
        if (falha.status === 401 || falha.status === 404) {
          setToken(null)
          setUsuario(null)
        }
      })
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    function atualizarPontos() {
      const token = getToken()
      if (!token) return
      getPerfil()
        .then((dados) => setUsuario(dados))
        .catch(() => {})
    }

    atualizarPontos()
    const depois = window.setTimeout(atualizarPontos, 2000)
    window.addEventListener('focus', atualizarPontos)
    document.addEventListener('visibilitychange', atualizarPontos)

    return () => {
      window.clearTimeout(depois)
      window.removeEventListener('focus', atualizarPontos)
      document.removeEventListener('visibilitychange', atualizarPontos)
    }
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      carregando,
      autenticado: Boolean(usuario),
      async login(credenciais) {
        const dados = await loginApi(credenciais)
        setToken(dados.token)
        setUsuario(dados.usuario)
        getPerfil()
          .then((perfil) => setUsuario(perfil))
          .catch(() => {})
        return dados
      },
      entrarComSessao({ token, usuario }) {
        setToken(token)
        setUsuario(usuario)
      },
      logout() {
        setToken(null)
        setUsuario(null)
      },
      atualizarUsuario(dados) {
        setUsuario((atual) => (atual ? { ...atual, ...dados } : dados))
      },
    }),
    [usuario, carregando],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return contexto
}
