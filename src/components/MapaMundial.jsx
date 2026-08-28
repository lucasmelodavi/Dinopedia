import { Link } from 'react-router-dom'

function posicao(lat, lng) {
  const esquerda = ((Number(lng) + 180) / 360) * 100
  const topo = ((90 - Number(lat)) / 180) * 100
  return {
    left: `${Math.min(96, Math.max(4, esquerda))}%`,
    top: `${Math.min(92, Math.max(8, topo))}%`,
  }
}

function Continentes() {
  return (
    <svg className="mapa-mundi-svg" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="mapa-oceano" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#102018" />
          <stop offset="100%" stopColor="#0a120e" />
        </linearGradient>
        <linearGradient id="mapa-terra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4d7a32" />
          <stop offset="100%" stopColor="#243c18" />
        </linearGradient>
      </defs>
      <rect width="360" height="180" fill="url(#mapa-oceano)" />
      <g stroke="rgba(94,163,58,0.12)" strokeWidth="0.4" fill="none">
        <path d="M0 90 H360" />
        <path d="M0 45 H360 M0 135 H360" />
        <path d="M90 0 V180 M180 0 V180 M270 0 V180" />
      </g>
      <g fill="url(#mapa-terra)" stroke="#6fb04a" strokeWidth="0.7" strokeLinejoin="round">
        <path d="M32 28 C50 16 92 20 114 42 C120 54 108 64 96 66 C88 80 68 84 56 70 C46 78 36 62 32 46 Z" />
        <path d="M108 78 C128 82 144 98 138 120 C130 142 116 154 110 140 C103 120 102 94 108 78 Z" />
        <path d="M128 12 C142 8 154 16 152 28 C142 34 128 30 128 12 Z" />
        <path d="M168 30 C190 22 206 32 206 48 C198 58 176 56 168 46 Z" />
        <path d="M172 58 C200 50 224 68 220 90 C214 116 204 130 196 118 C186 106 166 86 172 58 Z" />
        <path d="M210 30 C252 16 304 26 324 50 C330 70 300 80 276 72 C266 94 248 90 246 72 C230 66 212 50 210 30 Z" />
        <path d="M248 74 C262 76 268 92 258 98 C248 96 244 82 248 74 Z" />
        <path d="M292 108 C312 102 330 112 330 124 C320 134 300 132 292 120 Z" />
        <ellipse cx="226" cy="112" rx="4" ry="7" />
        <path d="M20 156 C90 148 180 150 260 154 C310 158 348 166 360 170 V180 H0 V168 C8 160 14 158 20 156 Z" />
      </g>
    </svg>
  )
}

export default function MapaMundial({ pontos = [] }) {
  return (
    <section className="mapa-secao" aria-labelledby="mapa-titulo">
      <h2 id="mapa-titulo">Mapa das fichas</h2>
      <p className="mapa-ajuda">
        Cada balão é de uma ficha que já existe. O lugar sai da região (ou do nome, se a região estiver vazia).
      </p>
      <div className="mapa-mundi">
        <Continentes />
        {pontos.map((dino) => (
          <Link
            key={dino.id}
            to={`/dinossauros/${dino.id}`}
            className="mapa-balao"
            style={posicao(dino.lat, dino.lng)}
            title={`${dino.nome}${dino.regiao ? ` · ${dino.regiao}` : ''}`}
          >
            <span
              className="mapa-balao-foto"
              style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
            />
            <strong>{dino.nome}</strong>
          </Link>
        ))}
        {pontos.length === 0 ? (
          <p className="mapa-vazio">Ainda não há fichas com região para mostrar no mapa.</p>
        ) : null}
      </div>
    </section>
  )
}
