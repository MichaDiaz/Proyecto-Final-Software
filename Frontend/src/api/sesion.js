// Guarda el token de sesión emitido por el backend.
const CLAVE = 'homeclass-token'

export function leerToken() {
  try { return sessionStorage.getItem(CLAVE) } catch { return null }
}
export function guardarToken(t) {
  try { sessionStorage.setItem(CLAVE, t) } catch { /* sin almacenamiento */ }
}
export function borrarToken() {
  try { sessionStorage.removeItem(CLAVE) } catch { /* nada */ }
}
