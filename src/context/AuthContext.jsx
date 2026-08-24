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
      .catch(() => {
        setToken(null)
        setUsuario(null)
      })
      .finally(() => setCarregando(false))
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
