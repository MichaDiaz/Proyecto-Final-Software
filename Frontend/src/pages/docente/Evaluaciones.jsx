import { useState } from 'react'
import { api } from '../../api/index.js'
import { useAviso } from '../../context/ToastContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { Badge, Cargando, Confirmar, ErrorCaja, Modal, Vacio } from '../../components/ui.jsx'
import { fechaCorta, hoyISO, TIPOS_EVALUACION } from '../../utils/formato.js'

const NUEVA = { nombre: '', tipo: 'tarea', peso: 10, fecha: hoyISO(), instrucciones: '', requiereEntrega: true, extensiones: 'pdf,docx,zip', maxMb: 10, permiteTardia: false }

// El docente crea tareas, proyectos y exámenes y define si los estudiantes suben archivo,
// qué tipos aceptan, cuánto pesan y hasta cuándo.
export default function Evaluaciones({ cursoId, alVerEntregas, alCambiar }) {
  const avisar = useAviso()
  const { datos, cargando, error, recargar } = useAsync(() => api.evaluaciones.listar(cursoId), [cursoId])
  const [editando, setEditando] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  if (cargando && !datos) return <Cargando />
  if (error) return <ErrorCaja mensaje={error} alReintentar={recargar} />

  const total = datos.reduce((s, e) => s + e.peso, 0)

  async function eliminar() {
    setOcupado(true)
    try {
      await api.evaluaciones.eliminar(aEliminar.id)
      avisar('Evaluación eliminada.')
      setAEliminar(null)
      recargar()
      alCambiar?.()
    } catch (err) { avisar(err.message, 'error') } finally { setOcupado(false) }
  }

  return (
    <>
      <section className="tarjeta">
        <div className="fila-espaciada">
          <div>
            <h2>Evaluaciones</h2>
            <p className="suave">Peso asignado: <strong>{total}%</strong> de 100%{total < 100 && ` · faltan ${100 - total}%`}</p>
            <progress max="100" value={total} aria-label="Peso asignado" />
          </div>
          <button type="button" className="btn btn-primario" onClick={() => setEditando({ ...NUEVA })} disabled={total >= 100}>
            <i className="bi bi-plus-lg" /> Nueva evaluación
          </button>
        </div>

        {datos.length === 0 ? (
          <Vacio icono="bi-clipboard2" titulo="Sin evaluaciones" texto="Crea una tarea, proyecto o examen." />
        ) : (
          <div className="tabla-caja interna">
            <table className="tabla">
              <thead><tr><th>Nombre</th><th>Tipo</th><th>Peso</th><th>Fecha</th><th>Entrega</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {datos.map((ev) => (
                  <tr key={ev.id}>
                    <td data-etiqueta="Nombre"><strong>{ev.nombre}</strong></td>
                    <td data-etiqueta="Tipo">{TIPOS_EVALUACION[ev.tipo]}</td>
                    <td data-etiqueta="Peso">{ev.peso}%</td>
                    <td data-etiqueta="Fecha">{fechaCorta(ev.fecha)}</td>
                    <td data-etiqueta="Entrega">
                      {ev.requiereEntrega
                        ? <Badge tono="info" icono="bi-cloud-arrow-up">{ev.extensiones.split(',').join(', ')} · {ev.maxMb} MB</Badge>
                        : <span className="suave">Sin archivo</span>}
                    </td>
                    <td className="celda-acciones">
                      {ev.requiereEntrega && <button type="button" className="btn btn-claro btn-chico" onClick={() => alVerEntregas(ev.id)}>Ver entregas</button>}
                      <button type="button" className="btn btn-claro btn-chico" onClick={() => setEditando({ ...ev })}>Editar</button>
                      <button type="button" className="btn btn-peligro-claro btn-chico" onClick={() => setAEliminar(ev)} aria-label={`Eliminar ${ev.nombre}`}><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <FormularioEvaluacion cursoId={cursoId} evaluacion={editando} alCerrar={() => setEditando(null)} alGuardar={() => { setEditando(null); recargar(); alCambiar?.() }} />
      <Confirmar
        abierto={!!aEliminar}
        titulo="Eliminar evaluación"
        texto={aEliminar && `Se eliminará "${aEliminar.nombre}" con sus notas y los archivos entregados por los estudiantes.`}
        alConfirmar={eliminar}
        alCancelar={() => setAEliminar(null)}
        ocupado={ocupado}
      />
    </>
  )
}

function FormularioEvaluacion({ cursoId, evaluacion, alCerrar, alGuardar }) {
  const avisar = useAviso()
  const [form, setForm] = useState(NUEVA)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [ultima, setUltima] = useState(null)

  if (evaluacion !== ultima) {
    setUltima(evaluacion)
    if (evaluacion) { setForm(evaluacion); setError(null) }
  }
  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await api.evaluaciones.guardar(cursoId, { ...form, peso: Number(form.peso), maxMb: Number(form.maxMb) })
      avisar(form.id ? 'Evaluación actualizada.' : 'Evaluación creada.')
      alGuardar()
    } catch (err) { setError(err.message) } finally { setEnviando(false) }
  }

  return (
    <Modal abierto={evaluacion !== null} titulo={form.id ? 'Editar evaluación' : 'Nueva evaluación'} alCerrar={alCerrar}>
      <form onSubmit={enviar} className="form-modal">
        <div className="campo"><label htmlFor="e-nombre">Nombre</label><input id="e-nombre" value={form.nombre} onChange={cambiar('nombre')} required /></div>
        <div className="dos-campos">
          <div className="campo">
            <label htmlFor="e-tipo">Tipo</label>
            <select id="e-tipo" value={form.tipo} onChange={cambiar('tipo')}>
              {Object.entries(TIPOS_EVALUACION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="campo"><label htmlFor="e-peso">Peso (%)</label><input id="e-peso" type="number" min="1" max="100" value={form.peso} onChange={cambiar('peso')} required /></div>
        </div>
        <div className="campo"><label htmlFor="e-fecha">Fecha {form.requiereEntrega ? 'límite de entrega' : 'de la evaluación'}</label><input id="e-fecha" type="date" value={form.fecha} onChange={cambiar('fecha')} required /></div>
        <div className="campo"><label htmlFor="e-instr">Instrucciones</label><textarea id="e-instr" rows={3} value={form.instrucciones} onChange={cambiar('instrucciones')} placeholder="Qué deben entregar y cómo se evalúa" /></div>

        <label className="interruptor">
          <input type="checkbox" checked={form.requiereEntrega} onChange={cambiar('requiereEntrega')} />
          <span>Los estudiantes suben un archivo</span>
        </label>

        {form.requiereEntrega && (
          <fieldset className="sub-form">
            <legend>Configuración de la entrega</legend>
            <div className="campo">
              <label htmlFor="e-ext">Tipos de archivo permitidos</label>
              <input id="e-ext" value={form.extensiones} onChange={cambiar('extensiones')} placeholder="pdf,docx,zip" />
              <small className="ayuda">Extensiones separadas por coma.</small>
            </div>
            <div className="dos-campos">
              <div className="campo"><label htmlFor="e-mb">Tamaño máximo (MB)</label><input id="e-mb" type="number" min="1" max="25" value={form.maxMb} onChange={cambiar('maxMb')} /></div>
              <label className="interruptor alinear">
                <input type="checkbox" checked={form.permiteTardia} onChange={cambiar('permiteTardia')} />
                <span>Aceptar entregas tardías</span>
              </label>
            </div>
          </fieldset>
        )}

        {error && <p className="msg msg-error" role="alert">{error}</p>}
        <div className="acciones">
          <button type="button" className="btn btn-claro" onClick={alCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  )
}
