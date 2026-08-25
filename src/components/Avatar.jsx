import { iniciais, urlFotoPerfil } from '../constants/avatares'
import { brocheDe, molduraDe } from '../constants/enfeites'

const ESTILO_CABECALHO = {
  width: 22,
  height: 22,
  maxWidth: 22,
  maxHeight: 22,
  overflow: 'hidden',
  borderRadius: '50%',
}

export default function Avatar({ usuario, className = 'perfil-avatar', alt }) {
  const foto = urlFotoPerfil(usuario)
  const moldura = molduraDe(usuario?.enfeites)
  const broche = brocheDe(usuario?.enfeites)
  const classes = ['avatar-envolve']
  const noCabecalho = className === 'cabecalho-avatar'
  if (moldura) classes.push(`moldura-${moldura.id}`)

  return (
    <span className={classes.join(' ')} style={noCabecalho ? ESTILO_CABECALHO : undefined}>
      <span className={className} style={noCabecalho ? ESTILO_CABECALHO : undefined}>
        {foto ? (
          <img
            className="avatar-foto"
            src={foto}
            alt={alt || `Foto de ${usuario?.nome || 'colaborador'}`}
            width={noCabecalho ? 22 : 84}
            height={noCabecalho ? 22 : 84}
            style={
              noCabecalho
                ? { ...ESTILO_CABECALHO, objectFit: 'cover', display: 'block' }
                : { width: '100%', height: '100%', objectFit: 'cover' }
            }
          />
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
