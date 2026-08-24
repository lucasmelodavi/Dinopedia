import { Link } from 'react-router-dom'

export default function Sobre() {
  return (
    <section className="pagina">
      <h1>Sobre a DinoPédia</h1>
      <p>
        A DinoPédia é uma enciclopédia colaborativa sobre dinossauros. Qualquer
        pessoa com conta confirmada pode consultar fichas, sugerir edições e
        ajudar a contar a história da era mesozoica.
      </p>
      <p>
        O conteúdo se organiza por período (Triássico, Jurássico e Cretáceo),
        dieta e família. As fichas vêm do nosso backend e podem receber foto e
        tópicos.
      </p>
      <p>
        O criador da DinoPédia é <strong>lucasmelodavi425@gmail.com</strong>.
        Com essa conta dá para excluir perfis de outros colaboradores.
      </p>
      <Link to="/dinossauros" className="botao">
        Ver dinossauros
      </Link>
    </section>
  )
}
