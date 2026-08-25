import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Inicio from './pages/Inicio'
import Catalogo from './pages/Catalogo'
import DinossauroDetalhe from './pages/DinossauroDetalhe'
import CadastroDinossauro from './pages/CadastroDinossauro'
import Login from './pages/Login'
import Registrar from './pages/Registrar'
import ConfirmarEmail from './pages/ConfirmarEmail'
import Perfil from './pages/Perfil'
import Amigos from './pages/Amigos'
import Sobre from './pages/Sobre'
import Contato from './pages/Contato'
import LinhaDoTempo from './pages/LinhaDoTempo'
import Ranking from './pages/Ranking'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/linha-do-tempo" element={<LinhaDoTempo />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/dinossauros" element={<Catalogo />} />
            <Route path="/dinossauros/novo" element={<CadastroDinossauro />} />
            <Route path="/dinossauros/:id" element={<DinossauroDetalhe />} />
            <Route path="/dinossauros/:id/editar" element={<CadastroDinossauro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registrar" element={<Registrar />} />
            <Route path="/confirmar" element={<ConfirmarEmail />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/amigos" element={<Amigos />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/usuarios/:id" element={<Perfil />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
