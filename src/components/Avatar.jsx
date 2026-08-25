import { iniciais, urlFotoPerfil } from '../constants/avatares'
import { brocheDe, molduraDe } from '../constants/enfeites'

export default function Avatar({ usuario, className = 'perfil-avatar', alt }) {
  const foto = urlFotoPerfil(usuario)
  const moldura = molduraDe(usuario?.enfeites)
  const broche = brocheDe(usuario?.enfeites)
  const classes = ['avatar-envolve']
  if (moldura) classes.push(`moldura-${moldura.id}`)

  return (
    <span className={classes.join(' ')}>
      <span className={className}>
        {foto ? (
          <img src={foto} alt={alt || `Foto de ${usuario?.nome || 'colaborador'}`} />
        ) : (
          iniciais(usuario?.nome)
        )}
      </span>
      {broche ? (
        <span className={`avatar-broche broche-${broche.id}`} title={broche.nome} aria-hidden="true">
          {broche.simbolo}
        </span>
      ) : null}
    </span>
  )
}
