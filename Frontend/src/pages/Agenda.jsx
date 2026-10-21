import { Link } from 'react-router-dom'
import { api } from '../api/index.js'
import useAsync from '../hooks/useAsync.js'
import { Badge, Cargando, Encabezado, ErrorCaja, Vacio } from '../components/ui.jsx'
import { fechaCorta } from '../utils/formato.js'

export default function Agenda() {
  const { datos, cargando, error, recargar } = useAsync(() => api.agenda.listar(), [])
  if (cargando) return <Cargando />
  if (error) return <ErrorCaja mensaje={error} alReintentar={recargar} />

  return (
    <>
      <Encabezado titulo="Agenda" subtitulo="Fechas y avisos de tus cursos." />
      {!datos?.length && <Vacio icono="bi-calendar3" titulo="Agenda vacía" texto="Cuando haya evaluaciones o avisos, aparecerán aquí." />}
      {datos?.length > 0 && (
        <ol className="agenda-lista">
          {datos.map((evento) => (
            <li key={`${evento.categoria}-${evento.id}`}>
              <time dateTime={evento.fecha}>{fechaCorta(evento.fecha)}</time>
              <article>
                <div className="agenda-meta">
                  <Badge tono={evento.categoria === 'aviso' ? 'info' : 'moderado'} icono={evento.categoria === 'aviso' ? 'bi-megaphone' : 'bi-calendar-event'}>
                    {evento.categoria === 'aviso' ? 'Aviso' : 'Evaluación'}
                  </Badge>
                  <Link to={`/app/cursos/${evento.cursoId}`}>{evento.curso}</Link>
                </div>
                <h2>{evento.titulo}</h2>
                {evento.tipoEvaluacion && <p className="suave">{evento.tipoEvaluacion}</p>}
                {evento.detalle && <p>{evento.detalle}</p>}
              </article>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}