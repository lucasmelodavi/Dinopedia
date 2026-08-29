import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="rodape">
      <div className="rodape-grade">
        <div>
          <strong>DINO PÉDIA</strong>
          <p>Descubra, aprenda, compartilhe.</p>
        </div>
        <div>
          <h3>Explorar</h3>
          <Link to="/linha-do-tempo">Linha do Tempo</Link>
          <Link to="/dinossauros">Dinossauros</Link>
          <Link to="/dinossauros/novo">Adicionar ficha</Link>
        </div>
        <div>
          <h3>Comunidade</h3>
          <Link to="/sobre">Regras de edição</Link>
          <Link to="/sobre">Contribuidores</Link>
          <Link to="/amigos">Amigos</Link>
          <Link to="/ranking">Ranking</Link>
          <Link to="/perfil">Perfil</Link>
        </div>
        <div>
          <h3>Ajuda</h3>
          <Link to="/contato">FAQ</Link>
          <Link to="/sobre">Como contribuir</Link>
          <Link to="/contato">Contato</Link>
        </div>
      </div>
      <p className="rodape-copy">© 2026 DinoPédia. Todos os direitos reservados.</p>
    </footer>
  )
}
