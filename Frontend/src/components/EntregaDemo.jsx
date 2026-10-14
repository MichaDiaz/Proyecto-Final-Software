import { useId, useState } from 'react'

// Reglas de esta "tarea de ejemplo". En el sistema real las define el docente
// al crear la evaluación (tipos permitidos y tamaño máximo).
const EXTENSIONES = ['pdf', 'docx', 'zip']
const MAX_MB = 10

// Función normal de JavaScript, fuera del componente: no necesita estado,
// solo recibe un archivo y devuelve un mensaje de error (o null si está bien).
function validar(archivo) {
  const extension = archivo.name.split('.').pop().toLowerCase()
  if (!EXTENSIONES.includes(extension)) {
    return `Solo se aceptan archivos ${EXTENSIONES.join(', ')}. El tuyo es .${extension}.`
  }
  if (archivo.size > MAX_MB * 1024 * 1024) {
    return `El archivo pesa más de ${MAX_MB} MB.`
  }
  return null
}

function formatoTamano(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function EntregaDemo() {
  // CONCEPTO 3: ESTADO. Cada useState es una "memoria" del componente.
  // Cuando llamas a su función (setArchivo...), React vuelve a dibujar el componente.
  const [archivo, setArchivo] = useState(null)
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(false)
  const idInput = useId() // id único para unir <label> con <input>

  // CONCEPTO 4: EVENTOS. React te da el evento (e); e.target.files trae lo elegido.
  function alElegirArchivo(e) {
    const elegido = e.target.files[0]
    if (!elegido) return

    const mensaje = validar(elegido)
    setError(mensaje)
    setArchivo(mensaje ? null : elegido)
    setEnviado(false)
  }

  return (
    <aside className="tarjeta-demo" aria-label="Ejemplo de entrega de una tarea">
      <p className="demo-etiqueta">Así entrega un estudiante</p>
      <h2>Proyecto final, entrega 2</h2>
      <p className="demo-meta">Vale 25%. Acepta {EXTENSIONES.join(', ')} hasta {MAX_MB} MB.</p>

      <label htmlFor={idInput} className="zona-archivo">
        <i className="bi bi-cloud-arrow-up" />
        <span>{archivo ? 'Cambiar archivo' : 'Elegir un archivo'}</span>
      </label>
      <input id={idInput} type="file" className="sr-only" onChange={alElegirArchivo} />

      {/* aria-live avisa a lectores de pantalla cuando el mensaje cambia */}
      <div aria-live="polite">
        {/* && muestra lo de la derecha SOLO si lo de la izquierda es verdadero */}
        {error && <p className="msg msg-error">{error}</p>}

        {archivo && !enviado && (
          <p className="msg msg-ok">
            <i className="bi bi-paperclip" /> {archivo.name} ({formatoTamano(archivo.size)})
          </p>
        )}

        {enviado && (
          <p className="msg msg-ok">
            <i className="bi bi-check-circle-fill" /> Entregado. Tu docente ya puede verlo.
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primario"
        disabled={!archivo || enviado}
        onClick={() => setEnviado(true)}
      >
        Entregar
      </button>
      <p className="demo-nota">Es una demostración: no se sube nada a ningún servidor.</p>
    </aside>
  )
}
