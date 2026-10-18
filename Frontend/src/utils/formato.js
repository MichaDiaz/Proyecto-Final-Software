export const TIPOS_EVALUACION = { tarea: 'Tarea', proyecto: 'Proyecto', examen: 'Examen' }

export function hoyISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function sumarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number)
  const f = new Date(a, m - 1, d + dias)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}

export function fechaCorta(iso) {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fechaHora(iso) {
  return new Date(iso).toLocaleString('es-NI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function tamano(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const num = (n, sufijo = '') => (n === null || n === undefined ? '—' : `${n}${sufijo}`)
