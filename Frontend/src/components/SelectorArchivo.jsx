import { useId, useRef } from 'react'
import { validarArchivo } from '../utils/archivos.js'
import { tamano } from '../utils/formato.js'

// Selector de archivo con validación de tipo y tamaño ANTES de enviar.
// Props: archivo (el elegido), alElegir(archivo|null), extensiones (arreglo), maxMb, error (texto externo)
export default function SelectorArchivo({ archivo, alElegir, extensiones, maxMb, etiqueta = 'Elegir un archivo', alError }) {
  const id = useId()
  const input = useRef(null)

  function alCambiar(e) {
    const f = e.target.files[0]
    if (!f) return
    const msg = validarArchivo(f, { extensiones, maxMb })
    if (msg) {
      alError?.(msg)
      alElegir(null)
      e.target.value = ''
    } else {
      alError?.(null)
      alElegir(f)
    }
  }

  return (
    <div className="selector">
      <label htmlFor={id} className="zona-archivo">
        <i className="bi bi-cloud-arrow-up" />
        <span>{archivo ? 'Cambiar archivo' : etiqueta}</span>
        {extensiones?.length > 0 && <small>{extensiones.join(', ')} · máx. {maxMb ?? 25} MB</small>}
      </label>
      <input id={id} ref={input} type="file" className="sr-only" onChange={alCambiar} accept={extensiones?.map((e) => `.${e}`).join(',')} />
      {archivo && (
        <p className="msg msg-ok">
          <i className="bi bi-paperclip" /> {archivo.name} ({tamano(archivo.size)})
          <button type="button" className="enlace" onClick={() => { alElegir(null); if (input.current) input.current.value = '' }}>Quitar</button>
        </p>
      )}
    </div>
  )
}
