import { crearSeed } from './seed.js'

// "Base de datos" del modo de ejemplo: un objeto JSON guardado en localStorage.
// Equivale a las tablas que tendrá SQL Server (ver docs/API.md, sección Modelo de datos).
const CLAVE = 'homeclass-db-v1'

export function leerDb() {
  try {
    const texto = localStorage.getItem(CLAVE)
    if (texto) return JSON.parse(texto)
  } catch { /* datos dañados: se recrean */ }
  const nueva = crearSeed()
  guardarDb(nueva)
  return nueva
}

export function guardarDb(db) {
  try { localStorage.setItem(CLAVE, JSON.stringify(db)) } catch { /* sin almacenamiento */ }
}

export function reiniciarDb() {
  try { localStorage.removeItem(CLAVE) } catch { /* nada */ }
  return leerDb()
}

export function siguienteId(db, tabla) {
  const id = db.contadores[tabla]
  db.contadores[tabla] = id + 1
  return id
}
