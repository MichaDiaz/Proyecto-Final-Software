import { EXTENSIONES_PERMITIDAS, MAX_MB_GLOBAL } from '../config.js'

export function extensionDe(nombre) {
  const i = nombre.lastIndexOf('.')
  return i < 0 ? '' : nombre.slice(i + 1).toLowerCase()
}

export function listaExtensiones(texto) {
  return texto.split(',').map((e) => e.trim().toLowerCase().replace(/^\./, '')).filter(Boolean)
}

// Devuelve un mensaje de error o null si el archivo es válido.
// opciones.extensiones: arreglo permitido para ESTA evaluación; opciones.maxMb: límite de ESTA evaluación.
export function validarArchivo(archivo, { extensiones, maxMb } = {}) {
  const ext = extensionDe(archivo.name)
  const permitidas = (extensiones?.length ? extensiones : EXTENSIONES_PERMITIDAS).filter((e) =>
    EXTENSIONES_PERMITIDAS.includes(e),
  )
  if (!ext || !permitidas.includes(ext)) {
    return `Tipo no permitido (.${ext || '?'}). Acepta: ${permitidas.join(', ')}.`
  }
  const limite = Math.min(maxMb ?? MAX_MB_GLOBAL, MAX_MB_GLOBAL)
  if (archivo.size > limite * 1024 * 1024) return `El archivo pesa más de ${limite} MB.`
  if (archivo.size === 0) return 'El archivo está vacío.'
  return null
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
