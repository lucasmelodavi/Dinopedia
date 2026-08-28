import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MapaContinentes from './MapaContinentes'

const ZOOM_MIN = 1
const ZOOM_MAX = 8
const ZOOM_PASSO = 1.28

function limitar(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function limitarVista(x, y, zoom) {
  if (zoom <= 1) return { x: 0, y: 0 }
  return {
    x: limitar(x, 0, 360 - 360 / zoom),
    y: limitar(y, 0, 180 - 180 / zoom),
  }
}

function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function xy(lat, lng) {
  return {
    x: limitar(((Number(lng) + 180) / 360) * 100, 0.6, 99.4),
    y: limitar(((90 - Number(lat)) / 180) * 100, 1.2, 97.5),
  }
}

function pinosVisiveis(pontos) {
  const grupos = new Map()
  pontos.forEach((ponto) => {
    const chave = `${Number(ponto.lat).toFixed(2)}:${Number(ponto.lng).toFixed(2)}`
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave).push(ponto)
  })

  const pinos = []
  grupos.forEach((itens) => {
    itens.forEach((ponto, ordem) => {
      pinos.push({
        ...ponto,
        left: xy(ponto.lat, ponto.lng).x,
        top: xy(ponto.lat, ponto.lng).y,
        ordem,
        juntos: itens.length,
      })
    })
  })
  return pinos
}

export default function MapaMundial({ pontos = [] }) {
  const pinos = pinosVisiveis(pontos)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [arrastando, setArrastando] = useState(false)
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 })
  const vista = useRef(null)
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const ponteiros = useRef(new Map())
  const pinca = useRef(null)
  const arrasto = useRef(null)
  const mousePressionado = useRef(false)
  const [clicando, setClicando] = useState(false)

  function gravarVista(novoZoom, novoPan) {
    zoomRef.current = novoZoom
    panRef.current = novoPan
    setZoom(novoZoom)
    setPan(novoPan)
  }

  function pontoNaVista(clienteX, clienteY) {
    const caixa = vista.current.getBoundingClientRect()
    return { x: clienteX - caixa.left, y: clienteY - caixa.top, w: caixa.width, h: caixa.height }
  }

  function svgDoPonto(px, py, panAtual, zoomAtual, largura, altura) {
    return {
      x: panAtual.x + (px / largura) * (360 / zoomAtual),
      y: panAtual.y + (py / altura) * (180 / zoomAtual),
    }
  }

  function aplicarZoom(novoZoom, ponto, largura, altura) {
    const z = limitar(novoZoom, ZOOM_MIN, ZOOM_MAX)
    if (z <= 1) {
      gravarVista(1, { x: 0, y: 0 })
      return
    }
    const svg = svgDoPonto(ponto.x, ponto.y, panRef.current, zoomRef.current, largura, altura)
    gravarVista(
      z,
      limitarVista(
        svg.x - (ponto.x / largura) * (360 / z),
        svg.y - (ponto.y / altura) * (180 / z),
        z,
      ),
    )
  }

  function zoomNoCentro(fator) {
    if (!vista.current) return
    const caixa = vista.current.getBoundingClientRect()
    aplicarZoom(zoomRef.current * fator, { x: caixa.width / 2, y: caixa.height / 2 }, caixa.width, caixa.height)
  }

  function zoomAbsoluto(nivel) {
    if (!vista.current) return
    const caixa = vista.current.getBoundingClientRect()
    aplicarZoom(nivel, { x: caixa.width / 2, y: caixa.height / 2 }, caixa.width, caixa.height)
  }

  const viewBox = `${pan.x} ${pan.y} ${360 / zoom} ${180 / zoom}`

  function seArrastou(evento) {
    if (!arrasto.current?.moveu) return false
    evento.preventDefault()
    evento.stopPropagation()
    return true
  }

  useEffect(() => {
    const el = vista.current
    if (!el) return undefined

    function noScroll(evento) {
      const clicouERolou = mousePressionado.current || (evento.buttons & 1) === 1
      if (!clicouERolou) return
      evento.preventDefault()
      aplicarZoom(
        zoomRef.current * (evento.deltaY > 0 ? 1 / 1.12 : 1.12),
        pontoNaVista(evento.clientX, evento.clientY),
        vista.current.getBoundingClientRect().width,
        vista.current.getBoundingClientRect().height,
      )
    }

    function soltarMouse() {
      mousePressionado.current = false
      setClicando(false)
    }

    el.addEventListener('wheel', noScroll, { passive: false })
    window.addEventListener('pointerup', soltarMouse)
    window.addEventListener('pointercancel', soltarMouse)
    const medida = new ResizeObserver(() => {
      const caixa = el.getBoundingClientRect()
      setTamanho({ w: caixa.width, h: caixa.height })
    })
    medida.observe(el)
    return () => {
      el.removeEventListener('wheel', noScroll)
      window.removeEventListener('pointerup', soltarMouse)
      window.removeEventListener('pointercancel', soltarMouse)
      medida.disconnect()
    }
  }, [])

  function aoPonteiroBaixo(evento) {
    if (evento.pointerType === 'mouse' && evento.button !== 0) return
    if (evento.pointerType === 'mouse') {
      mousePressionado.current = true
      setClicando(true)
    }
    if (evento.target.closest('.mapa-balao-botao')) return

    vista.current.setPointerCapture(evento.pointerId)
    ponteiros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY })
    const pts = [...ponteiros.current.values()]

    if (pts.length === 1) {
      arrasto.current = {
        x: evento.clientX,
        y: evento.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        moveu: false,
      }
    }

    if (pts.length === 2) {
      const caixa = vista.current.getBoundingClientRect()
      const meio = {
        x: (pts[0].x + pts[1].x) / 2 - caixa.left,
        y: (pts[0].y + pts[1].y) / 2 - caixa.top,
      }
      pinca.current = {
        dist: distancia(pts[0], pts[1]),
        zoom: zoomRef.current,
        pan: { ...panRef.current },
        px: meio.x,
        py: meio.y,
      }
      arrasto.current = { ...arrasto.current, moveu: true }
    }
  }

  function aoPonteiroMove(evento) {
    if (!ponteiros.current.has(evento.pointerId)) return
    ponteiros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY })
    const pts = [...ponteiros.current.values()]
    const caixa = vista.current.getBoundingClientRect()

    if (pts.length >= 2 && pinca.current?.dist) {
      const meio = {
        x: (pts[0].x + pts[1].x) / 2 - caixa.left,
        y: (pts[0].y + pts[1].y) / 2 - caixa.top,
      }
      const z = limitar(pinca.current.zoom * (distancia(pts[0], pts[1]) / pinca.current.dist), ZOOM_MIN, ZOOM_MAX)
      const svg = svgDoPonto(pinca.current.px, pinca.current.py, pinca.current.pan, pinca.current.zoom, caixa.width, caixa.height)
      gravarVista(
        z,
        limitarVista(
          svg.x - (meio.x / caixa.width) * (360 / z),
          svg.y - (meio.y / caixa.height) * (180 / z),
          z,
        ),
      )
      return
    }

    if (pts.length === 1 && arrasto.current && zoomRef.current > 1) {
      const dx = evento.clientX - arrasto.current.x
      const dy = evento.clientY - arrasto.current.y
      if (Math.hypot(dx, dy) > 6) {
        arrasto.current.moveu = true
        setArrastando(true)
      }
      const z = zoomRef.current
      gravarVista(
        z,
        limitarVista(
          arrasto.current.panX - (dx / caixa.width) * (360 / z),
          arrasto.current.panY - (dy / caixa.height) * (180 / z),
          z,
        ),
      )
    }
  }

  function aoPonteiroSobe(evento) {
    ponteiros.current.delete(evento.pointerId)
    if (ponteiros.current.size < 2) pinca.current = null
    if (ponteiros.current.size === 0) {
      setArrastando(false)
      window.setTimeout(() => {
        arrasto.current = null
      }, 0)
    }
  }

  return (
    <section className="mapa-secao" id="mapa" aria-labelledby="mapa-titulo">
      <h2 id="mapa-titulo">Mapa-múndi</h2>
      <p className="mapa-ajuda">
        Clique no pino para abrir a ficha. Cada dinossauro fica no lugar em que foi achado.
      </p>
      <div className="mapa-mundi">
        <div
          ref={vista}
          className={`mapa-mundi-vista${zoom > 1 ? ' is-arrastavel' : ''}${arrastando ? ' is-arrastando' : ''}${clicando ? ' is-clicando' : ''}`}
          onPointerDown={aoPonteiroBaixo}
          onPointerMove={aoPonteiroMove}
          onPointerUp={aoPonteiroSobe}
          onPointerCancel={aoPonteiroSobe}
        >
          <MapaContinentes viewBox={viewBox} />
          <div className="mapa-pinos">
          {pinos.map((dino) => {
            let left = dino.left
            let top = dino.top
            if (tamanho.w && tamanho.h) {
              left = (((dino.left / 100) * 360 - pan.x) * zoom * tamanho.w) / 360
              top = (((dino.top / 100) * 180 - pan.y) * zoom * tamanho.h) / 180
              if (dino.juntos > 1) {
                const angulo = (dino.ordem / dino.juntos) * Math.PI * 2 - Math.PI / 2
                left += Math.cos(angulo) * 14
                top += Math.sin(angulo) * 14
              }
            }
            return (
              <div
                key={dino.id}
                className="mapa-balao"
                style={{
                  left: tamanho.w ? `${left}px` : `${dino.left}%`,
                  top: tamanho.h ? `${top}px` : `${dino.top}%`,
                }}
              >
                <Link
                  to={`/dinossauros/${dino.id}`}
                  className="mapa-balao-botao"
                  title={`${dino.nome}${dino.regiao ? ` · ${dino.regiao}` : ''}`}
                  onClick={seArrastou}
                >
                  <span
                    className="mapa-balao-foto"
                    style={dino.fotoUrl ? { backgroundImage: `url(${dino.fotoUrl})` } : undefined}
                  />
                </Link>
                <strong>{dino.nome}</strong>
              </div>
            )
          })}
          </div>
          {pontos.length === 0 ? (
            <p className="mapa-vazio">Carregando os dinossauros no mapa...</p>
          ) : null}
        </div>
        <div className="mapa-zoom" role="group" aria-label="Zoom do mapa">
          <button type="button" className="mapa-zoom-btn" onClick={() => zoomNoCentro(1 / ZOOM_PASSO)} disabled={zoom <= ZOOM_MIN} aria-label="Afastar">
            −
          </button>
          <input
            className="mapa-zoom-barra"
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step="0.05"
            value={zoom}
            aria-label="Nível de zoom"
            onChange={(evento) => zoomAbsoluto(Number(evento.target.value))}
          />
          <button type="button" className="mapa-zoom-btn" onClick={() => zoomNoCentro(ZOOM_PASSO)} disabled={zoom >= ZOOM_MAX} aria-label="Aproximar">
            +
          </button>
          <span className="mapa-zoom-valor">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="mapa-zoom-mundo"
            onClick={() => gravarVista(1, { x: 0, y: 0 })}
            disabled={zoom <= 1}
            aria-label="Ver o mundo todo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M3 12h18M12 3c2.8 2.6 4.2 6 4.2 9s-1.4 6.4-4.2 9c-2.8-2.6-4.2-6-4.2-9s1.4-6.4 4.2-9Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
