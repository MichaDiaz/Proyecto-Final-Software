import { useEffect, useState } from 'react'
import { api } from '../../api/index.js'
import { useAviso } from '../../context/ToastContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { Badge, Cargando, ErrorCaja, Vacio } from '../../components/ui.jsx'
import { descargarBlob } from '../../utils/archivos.js'
import { fechaHora, tamano } from '../../utils/formato.js'

// Revisión de entregas: quién subió qué, descarga del archivo y calificación en el mismo lugar.
export default function Entregas({ cursoId, evaluacionInicial, alCalificar }) {
  const avisar = useAviso()
  const { datos: evaluaciones, cargando: cargandoEv } = useAsync(() => api.evaluaciones.listar(cursoId), [cursoId])
  const conArchivo = (evaluaciones ?? []).filter((e) => e.requiereEntrega)
  const [elegida, setElegida] = useState(evaluacionInicial)

  useEffect(() => {
    if (!elegida && conArchivo.length > 0) setElegida(conArchivo[0].id)
  }, [conArchivo, elegida])

  const { datos, cargando, error, recargar } = useAsync(
    () => (elegida ? api.entregas.listarPorEvaluacion(elegida) : Promise.resolve(null)),
    [elegida],
  )

  if (cargandoEv && !evaluaciones) return <Cargando />
  if (conArchivo.length === 0) {
    return <Vacio icono="bi-inbox" titulo="Ninguna evaluación recibe archivos" texto="Activa «Los estudiantes suben un archivo» al crear o editar una evaluación." />
  }

  async function descargar(entrega) {
    try {
      const { blob, nombre } = await api.entregas.descargar(entrega.id)
      descargarBlob(blob, nombre)
    } catch (err) { avisar(err.message, 'error') }
  }

  async function calificar(e, fila) {
    const texto = e.target.value.trim().replace(',', '.')
    const nueva = texto === '' ? null : Number(texto)
    if (nueva === fila.nota) return
    if (nueva !== null && !(Number.isFinite(nueva) && nueva >= 0 && nueva <= 100)) {
      avisar('La nota debe estar entre 0 y 100.', 'error')
      e.target.value = fila.nota ?? ''
      return
    }
    try {
      await api.calificaciones.guardarNota(elegida, fila.estudianteId, nueva)
      avisar('Nota guardada.')
      recargar()
      alCalificar?.()
    } catch (err) { avisar(err.message, 'error'); e.target.value = fila.nota ?? '' }
  }

  const entregaron = datos?.filas.filter((f) => f.entrega).length ?? 0

  return (
    <section className="tarjeta">
      <div className="fila-form">
        <div className="campo campo-en-linea">
          <label htmlFor="en-eval">Evaluación</label>
          <select id="en-eval" value={elegida ?? ''} onChange={(e) => setElegida(Number(e.target.value))}>
            {conArchivo.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        {datos && <span className="suave">{entregaron} de {datos.filas.length} entregaron</span>}
      </div>

      {cargando && !datos && <Cargando />}
      {error && <ErrorCaja mensaje={error} alReintentar={recargar} />}

      {datos && (
        <div className="tabla-caja interna">
          <table className="tabla">
            <thead><tr><th>Estudiante</th><th>Entrega</th><th>Archivo</th><th>Nota</th></tr></thead>
            <tbody>
              {datos.filas.map((f) => (
                <tr key={f.estudianteId}>
                  <td data-etiqueta="Estudiante"><strong>{f.nombre}</strong></td>
                  <td data-etiqueta="Entrega">
                    {!f.entrega && <Badge tono="neutro" icono="bi-dash-circle">Sin entrega</Badge>}
                    {f.entrega && !f.entrega.tardia && <Badge tono="bajo" icono="bi-check-circle-fill">{fechaHora(f.entrega.fecha)}</Badge>}
                    {f.entrega?.tardia && <Badge tono="moderado" icono="bi-clock-history">Tardía · {fechaHora(f.entrega.fecha)}</Badge>}
                  </td>
                  <td data-etiqueta="Archivo">
                    {f.entrega ? (
                      <button type="button" className="btn btn-claro btn-chico" onClick={() => descargar(f.entrega)}>
                        <i className="bi bi-download" /> {f.entrega.nombreOriginal} <small>({tamano(f.entrega.tamano)})</small>
                      </button>
                    ) : '—'}
                    {f.entrega?.comentario && <div className="suave comentario">“{f.entrega.comentario}”</div>}
                  </td>
                  <td data-etiqueta="Nota">
                    <input
                      className="nota"
                      type="text"
                      inputMode="decimal"
                      aria-label={`Nota de ${f.nombre}`}
                      defaultValue={f.nota ?? ''}
                      key={`${f.estudianteId}-${f.nota}`}
                      onBlur={(e) => calificar(e, f)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
