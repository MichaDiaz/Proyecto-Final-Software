import { useState } from 'react'
import { api } from '../../api/index.js'
import { useAviso } from '../../context/ToastContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import SelectorArchivo from '../../components/SelectorArchivo.jsx'
import { Cargando, Confirmar, ErrorCaja, Vacio } from '../../components/ui.jsx'
import { descargarBlob } from '../../utils/archivos.js'
import { fechaCorta, tamano } from '../../utils/formato.js'

// Materiales del curso: guías, presentaciones y lecturas que sube el docente.
export default function Materiales({ cursoId }) {
  const avisar = useAviso()
  const { datos, cargando, error, recargar } = useAsync(() => api.materiales.listar(cursoId), [cursoId])
  const [titulo, setTitulo] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [errorArchivo, setErrorArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [aEliminar, setAEliminar] = useState(null)

  async function subir(e) {
    e.preventDefault()
    if (!archivo) return setErrorArchivo('Elige un archivo.')
    setSubiendo(true)
    try {
      await api.materiales.subir(cursoId, titulo, archivo)
      setTitulo('')
      setArchivo(null)
      avisar('Material subido.')
      recargar()
    } catch (err) { setErrorArchivo(err.message) } finally { setSubiendo(false) }
  }

  async function descargar(m) {
    try {
      const { blob, nombre } = await api.materiales.descargar(m.id)
      descargarBlob(blob, nombre)
    } catch (err) { avisar(err.message, 'error') }
  }

  async function eliminar() {
    try {
      await api.materiales.eliminar(aEliminar.id)
      avisar('Material eliminado.')
      setAEliminar(null)
      recargar()
    } catch (err) { avisar(err.message, 'error') }
  }

  return (
    <>
      <section className="tarjeta">
        <h2>Subir material</h2>
        <form onSubmit={subir} className="form-modal">
          <div className="campo"><label htmlFor="m-titulo">Título</label><input id="m-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></div>
          <SelectorArchivo archivo={archivo} alElegir={setArchivo} alError={setErrorArchivo} maxMb={25} />
          {errorArchivo && <p className="msg msg-error" role="alert">{errorArchivo}</p>}
          <div className="acciones"><button className="btn btn-primario" type="submit" disabled={subiendo}>{subiendo ? 'Subiendo…' : 'Subir material'}</button></div>
        </form>
      </section>

      <section className="tarjeta">
        <h2>Materiales del curso</h2>
        {cargando && !datos && <Cargando />}
        {error && <ErrorCaja mensaje={error} alReintentar={recargar} />}
        {datos?.length === 0 && <Vacio icono="bi-folder2" titulo="Sin materiales" texto="Los archivos que subas aquí los verán los estudiantes." />}
        {datos?.length > 0 && (
          <ul className="lista">
            {datos.map((m) => (
              <li key={m.id}>
                <div><strong>{m.titulo}</strong><div className="suave">{m.nombreOriginal} · {tamano(m.tamano)} · {fechaCorta(m.fecha)}</div></div>
                <div className="acciones-linea">
                  <button type="button" className="btn btn-claro btn-chico" onClick={() => descargar(m)}><i className="bi bi-download" /> Descargar</button>
                  <button type="button" className="btn btn-peligro-claro btn-chico" onClick={() => setAEliminar(m)} aria-label={`Eliminar ${m.titulo}`}><i className="bi bi-trash" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Confirmar abierto={!!aEliminar} titulo="Eliminar material" texto={aEliminar && `Se eliminará "${aEliminar.titulo}".`} alConfirmar={eliminar} alCancelar={() => setAEliminar(null)} />
    </>
  )
}
