import { api } from '../../api/index.js'
import useAsync from '../../hooks/useAsync.js'
import { Badge, Cargando, Encabezado, ErrorCaja, Vacio } from '../../components/ui.jsx'
import { fechaCorta, num } from '../../utils/formato.js'

const ESTADO = { calificada: ['bajo', 'Calificada'], entregada: ['info', 'Entregada'], vencida: ['alto', 'Vencida'], pendiente: ['moderado', 'Pendiente'] }

export default function Historial() {
  const { datos, cargando, error, recargar } = useAsync(() => api.estudiante.historial(), [])
  if (cargando) return <Cargando />
  if (error) return <ErrorCaja mensaje={error} alReintentar={recargar} />

  return (
    <>
      <Encabezado titulo="Historial académico" subtitulo="Evaluaciones, calificaciones y entregas de tus cursos." />
      {!datos?.length && <Vacio icono="bi-clock-history" titulo="Sin actividad académica" texto="Tu historial aparecerá aquí al iniciar tus cursos." />}
      {datos?.length > 0 && (
        <div className="tabla-caja">
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Curso</th><th>Evaluación</th><th>Nota</th><th>Estado</th><th>Entrega</th></tr></thead>
            <tbody>
              {datos.map((fila) => {
                const [tono, texto] = ESTADO[fila.estado] ?? ['neutro', fila.estado]
                return <tr key={`${fila.evaluacionId}-${fila.cursoId}`}>
                  <td data-etiqueta="Fecha">{fechaCorta(fila.fecha)}</td>
                  <td data-etiqueta="Curso">{fila.curso}</td>
                  <td data-etiqueta="Evaluación"><strong>{fila.evaluacion}</strong><small className="suave">{fila.tipo} · {num(fila.peso, '%')}</small></td>
                  <td data-etiqueta="Nota">{num(fila.nota)}</td>
                  <td data-etiqueta="Estado"><Badge tono={tono}>{texto}</Badge></td>
                  <td data-etiqueta="Entrega">{fila.archivo ? <>{fila.archivo}{fila.tardia && <Badge tono="moderado">Tardía</Badge>}</> : '—'}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}