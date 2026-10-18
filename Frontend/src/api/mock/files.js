// Almacén de archivos del MODO DE EJEMPLO. Guarda los archivos en IndexedDB del navegador
// (localStorage es muy pequeño para archivos). Con backend real esto no se usa:
// el archivo viaja al servidor y allí se guarda (disco, Azure Blob, S3...).
const NOMBRE_DB = 'homeclass-archivos'
const TABLA = 'archivos'
const memoria = new Map() // respaldo si IndexedDB no está disponible

function abrir() {
  return new Promise((resolver, rechazar) => {
    if (!('indexedDB' in window)) return rechazar(new Error('sin indexedDB'))
    const req = indexedDB.open(NOMBRE_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(TABLA)
    req.onsuccess = () => resolver(req.result)
    req.onerror = () => rechazar(req.error)
  })
}

async function operar(modo, fn) {
  const db = await abrir()
  return new Promise((resolver, rechazar) => {
    const tx = db.transaction(TABLA, modo)
    const res = fn(tx.objectStore(TABLA))
    tx.oncomplete = () => resolver(res?.result)
    tx.onerror = () => rechazar(tx.error)
  })
}

export async function guardarArchivo(blob) {
  const id = crypto.randomUUID()
  try { await operar('readwrite', (s) => s.put(blob, id)) } catch { memoria.set(id, blob) }
  return id
}

export async function leerArchivo(id) {
  if (!id) return null
  if (memoria.has(id)) return memoria.get(id)
  try { return (await operar('readonly', (s) => s.get(id))) ?? null } catch { return null }
}

export async function borrarArchivo(id) {
  if (!id) return
  memoria.delete(id)
  try { await operar('readwrite', (s) => s.delete(id)) } catch { /* nada */ }
}
