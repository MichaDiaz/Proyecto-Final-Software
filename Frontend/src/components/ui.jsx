import { cloneElement, useEffect, useId, useRef } from 'react'

// ===== Piezas de interfaz reutilizables =====

export function Cargando({ texto = 'Cargando…' }) {
  return <p className="cargando" role="status"><i className="bi bi-arrow-repeat girar" /> {texto}</p>
}

export function ErrorCaja({ mensaje, alReintentar }) {
  return (
    <div className="msg msg-error" role="alert">
      {mensaje}{' '}
      {alReintentar && <button type="button" className="enlace" onClick={alReintentar}>Reintentar</button>}
    </div>
  )
}

export function Vacio({ icono = 'bi-inbox', titulo, texto, children }) {
  return (
    <div className="vacio">
      <i className={`bi ${icono}`} />
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  )
}

export function StatCard({ etiqueta, valor, nota, icono, tono }) {
  return (
    <div className={`stat ${tono ? `stat-${tono}` : ''}`}>
      {icono && <span className="stat-icono"><i className={`bi ${icono}`} /></span>}
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
      {nota && <small>{nota}</small>}
    </div>
  )
}

const ETIQUETAS_RIESGO = { alto: 'Riesgo alto', moderado: 'Riesgo moderado', bajo: 'Al día', 'sin-datos': 'Sin datos' }
const ICONOS_RIESGO = { alto: 'bi-exclamation-octagon-fill', moderado: 'bi-exclamation-triangle-fill', bajo: 'bi-check-circle-fill', 'sin-datos': 'bi-dash-circle' }

// El color nunca va solo: siempre con icono y texto.
export function BadgeRiesgo({ nivel }) {
  return <span className={`badge badge-${nivel}`}><i className={`bi ${ICONOS_RIESGO[nivel]}`} /> {ETIQUETAS_RIESGO[nivel]}</span>
}

export function Badge({ tono = 'neutro', icono, children }) {
  return <span className={`badge badge-${tono}`}>{icono && <i className={`bi ${icono}`} />} {children}</span>
}

export function Campo({ etiqueta, ayuda, children }) {
  const id = useId()
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {/* clonamos el hijo para unirlo con su <label> */}
      {cloneElement(children, { id })}
      {ayuda && <small className="ayuda">{ayuda}</small>}
    </div>
  )
}

// Ventana modal accesible basada en <dialog>: cierra con Esc y devuelve el foco.
export function Modal({ abierto, titulo, alCerrar, children, ancho }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      className="modal"
      style={ancho ? { maxWidth: ancho } : undefined}
      onClose={alCerrar}
      onClick={(e) => e.target === ref.current && alCerrar()}
    >
      {abierto && (
        <div className="modal-contenido">
          <header className="modal-cab">
            <h2>{titulo}</h2>
            <button type="button" className="icon-btn" onClick={alCerrar} aria-label="Cerrar"><i className="bi bi-x-lg" /></button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function Confirmar({ abierto, titulo, texto, textoBoton = 'Eliminar', alConfirmar, alCancelar, ocupado }) {
  return (
    <Modal abierto={abierto} titulo={titulo} alCerrar={alCancelar} ancho="440px">
      <p>{texto}</p>
      <div className="acciones">
        <button type="button" className="btn btn-claro" onClick={alCancelar}>Cancelar</button>
        <button type="button" className="btn btn-peligro" onClick={alConfirmar} disabled={ocupado}>{ocupado ? 'Procesando…' : textoBoton}</button>
      </div>
    </Modal>
  )
}

// Pestañas accesibles (flechas ← → cambian de pestaña).
export function Tabs({ items, activo, alCambiar, etiqueta }) {
  function alTeclear(e, i) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const sig = (i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length
    alCambiar(items[sig].id)
    document.getElementById(`tab-${items[sig].id}`)?.focus()
  }
  return (
    <div className="tabs" role="tablist" aria-label={etiqueta}>
      {items.map((t, i) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          type="button"
          role="tab"
          aria-selected={t.id === activo}
          tabIndex={t.id === activo ? 0 : -1}
          className={t.id === activo ? 'tab activa' : 'tab'}
          onClick={() => alCambiar(t.id)}
          onKeyDown={(e) => alTeclear(e, i)}
        >
          {t.icono && <i className={`bi ${t.icono}`} />} {t.etiqueta}
        </button>
      ))}
    </div>
  )
}

// Barras horizontales con etiqueta y valor en texto (no dependen solo del color).
export function BarList({ filas, max = 100, sufijo = '' }) {
  if (filas.length === 0) return <p className="suave">Sin datos todavía.</p>
  return (
    <ul className="barras">
      {filas.map((f) => (
        <li key={f.etiqueta}>
          <span className="barra-etiqueta">{f.etiqueta}</span>
          <span className="barra-pista" aria-hidden="true">
            <span className={`barra-relleno ${f.tono ? `barra-${f.tono}` : ''}`} style={{ width: `${Math.min(100, ((f.valor ?? 0) / max) * 100)}%` }} />
          </span>
          <span className="barra-valor">{f.valor === null || f.valor === undefined ? '—' : `${f.valor}${sufijo}`}</span>
        </li>
      ))}
    </ul>
  )
}

export function Encabezado({ titulo, subtitulo, children }) {
  return (
    <header className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="suave">{subtitulo}</p>}
      </div>
      {children && <div className="encabezado-acciones">{children}</div>}
    </header>
  )
}
