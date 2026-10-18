import { api } from '../../api/index.js'
import { useAviso } from '../../context/ToastContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { BadgeRiesgo, Cargando, ErrorCaja, Vacio } from '../../components/ui.jsx'
import { num } from '../../utils/formato.js'

// Libro de calificaciones: escribe una nota, sal del campo y se guarda. El promedio se recalcula.
export default function Libro({ cursoId, alCambiar }) {
  const avisar = useAviso()
  const { datos, cargando, error, recargar } = useAsync(() => api.calificaciones.libro(cursoId), [cursoId])

  if (cargando && !datos) return <Cargando />
  if (error) return <ErrorCaja mensaje={error} alReintentar={recargar} />
  if (datos.evaluaciones.length === 0) return <Vacio icono="bi-clipboard2" titulo="Aún no hay evaluaciones" texto="Crea la primera en la pestaña Evaluaciones." />
  if (datos.filas.length === 0) return <Vacio icono="bi-person-x" titulo="Sin estudiantes" texto="Administración debe matricular estudiantes en este curso." />

  async function guardar(e, fila, ev) {
    const original = fila.notas[ev.id]
    const texto = e.target.value.trim().replace(',', '.')
    const nueva = texto === '' ? null : Number(texto)
    if (nueva === original) return
    if (nueva !== null && !(Number.isFinite(nueva) && nueva >= 0 && nueva <= 100)) {
      avisar('La nota debe estar entre 0 y 100.', 'error')
      e.target.value = original ?? ''
      return
    }
    try {
      await api.calificaciones.guardarNota(ev.id, fila.estudianteId, nueva)
      recargar()
      alCambiar?.()
    } catch (err) {
      avisar(err.message, 'error')
      e.target.value = original ?? ''
    }
  }

  return (
    <div className="tabla-caja">
      <table className="tabla tabla-libro">
        <thead>
          <tr>
            <th>Estudiante</th>
            {datos.evaluaciones.map((ev) => <th key={ev.id}>{ev.nombre}<small>{ev.peso}%</small></th>)}
            <th>Promedio</th>
            <th>Asist.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {datos.filas.map((f) => (
            <tr key={f.estudianteId}>
              <th scope="row">{f.nombre}</th>
              {datos.evaluaciones.map((ev) => {
                const pendiente = ev.requiereEntrega && f.entregas[ev.id] && f.notas[ev.id] === null
                return (
                  <td key={ev.id}>
                    <input
                      className="nota"
                      type="text"
                      inputMode="decimal"
                      aria-label={`Nota de ${f.nombre} en ${ev.nombre}`}
                      defaultValue={f.notas[ev.id] ?? ''}
                      key={`${f.estudianteId}-${ev.id}-${f.notas[ev.id]}`}
                      onBlur={(e) => guardar(e, f, ev)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                    {pendiente && <small className="por-revisar" title="Entregó, falta calificar"><i className="bi bi-paperclip" /> por revisar</small>}
                  </td>
                )
              })}
              <td><strong>{num(f.promedio)}</strong></td>
              <td>{num(f.asistencia, '%')}</td>
              <td><BadgeRiesgo nivel={f.riesgo} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
