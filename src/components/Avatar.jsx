import { iniciais, urlFotoPerfil } from '../constants/avatares'

export default function Avatar({ usuario, className = 'perfil-avatar', alt }) {
  const foto = urlFotoPerfil(usuario)

  return (
    <span className={className}>
      {foto ? (
        <img src={foto} alt={alt || `Foto de ${usuario?.nome || 'colaborador'}`} />
      ) : (
        iniciais(usuario?.nome)
      )}
    </span>
  )
}
