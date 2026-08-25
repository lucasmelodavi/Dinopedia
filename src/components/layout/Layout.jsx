import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'
import PainelPontos from './PainelPontos'

export default function Layout() {
  const { pathname } = useLocation()
  const home = pathname === '/'
  const largo = pathname === '/perfil' || pathname === '/amigos' || pathname.startsWith('/usuarios/')

  return (
    <div className="app">
      <Header />
      <PainelPontos />
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
