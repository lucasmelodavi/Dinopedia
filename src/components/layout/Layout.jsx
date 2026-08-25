import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'
import IndiceLateral from './IndiceLateral'

export default function Layout() {
  const { pathname } = useLocation()
  const [indiceAberto, setIndiceAberto] = useState(false)
  const home = pathname === '/'
  const largo = pathname === '/perfil' || pathname === '/amigos' || pathname.startsWith('/usuarios/')
  const mudarIndice = useCallback((valor) => setIndiceAberto(valor), [])

  return (
    <div className="app">
      <Header indiceAberto={indiceAberto} onAbrirIndice={() => setIndiceAberto((valor) => !valor)} />
      <IndiceLateral aberto={indiceAberto} onMudar={mudarIndice} />
      <main
        className={
          home ? 'conteudo conteudo--home' : largo ? 'conteudo conteudo--perfil' : 'conteudo'
        }
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
