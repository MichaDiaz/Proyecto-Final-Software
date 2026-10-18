import { Link } from 'react-router-dom'
import { api } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import useAsync from '../hooks/useAsync.js'
import { BadgeRiesgo, BarList, Cargando, Encabezado, ErrorCaja, StatCard, Vacio, Badge } from '../components/ui.jsx'
import { fechaCorta, num, TIPOS_EVALUACION } from '../utils/formato.js'

// Una misma ruta (/app) muestra un balance distinto según quién entró.
export default function Resumen() {
  const { usuario } = useAuth()
  const { datos, cargando, error, recargar } = useAsync(() => api.dashboard.obtener(), [])

  if (cargando) return <Cargando />
  if (error) return <ErrorCaja mensaje={error} alReintentar={recargar} />

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario.nombre.split(' ')[0]}`} subtitulo="Este es tu balance de hoy." />
      {datos.rol === 'admin' && <ResumenAdmin d={datos} />}
      {datos.rol === 'docente' && <ResumenDocente d={datos} />}
      {datos.rol === 'estudiante' && <ResumenEstudiante d={datos} />}
    </>
  )
}

function ResumenAdmin({ d }) {
  const totalRiesgo = d.riesgo.alto + d.riesgo.moderado + d.riesgo.bajo
  return (
    <>
      <dl className="stats">
        <StatCard etiqueta="Cuentas" valor={d.usuarios.total} nota={`${d.usuarios.docentes} docentes · ${d.usuarios.estudiantes} estudiantes`} icono="bi-people" />
        <StatCard etiqueta="Cursos" valor={d.cursos.length} icono="bi-journal-bookmark" />
        <StatCard etiqueta="Promedio general" valor={num(d.promedioGeneral)} icono="bi-bar-chart" />
        <StatCard etiqueta="Asistencia general" valor={num(d.asistenciaGeneral, '%')} icono="bi-calendar-check" />
      </dl>
      <div className="dos-col">
        <section className="tarjeta">
          <h2>Promedio por curso</h2>
          <BarList filas={d.cursos.map((c) => ({ etiqueta: c.nombre, valor: c.promedio }))} />
        </section>
        <section className="tarjeta">
          <h2>Estudiantes por nivel de riesgo</h2>
          <BarList max={Math.max(totalRiesgo, 1)} filas={[
            { etiqueta: 'Riesgo alto', valor: d.riesgo.alto, tono: 'alto' },
            { etiqueta: 'Riesgo moderado', valor: d.riesgo.moderado, tono: 'moderado' },
            { etiqueta: 'Al día', valor: d.riesgo.bajo, tono: 'bajo' },
          ]} />
          <p className="suave">Matrículas evaluadas: {totalRiesgo}. {d.usuarios.inactivos > 0 && `Cuentas inactivas: ${d.usuarios.inactivos}.`}</p>
          <div className="acciones-linea">
            <Link className="btn btn-claro" to="/app/usuarios">Gestionar usuarios</Link>
            <Link className="btn btn-claro" to="/app/cursos">Gestionar cursos</Link>
          </div>
        </section>
      </div>
    </>
  )
}

function ResumenDocente({ d }) {
  return (
    <>
      <dl className="stats">
        <StatCard etiqueta="Mis cursos" valor={d.cursos.length} icono="bi-easel" />
        <StatCard etiqueta="Entregas por revisar" valor={d.porRevisar} icono="bi-inbox" tono={d.porRevisar > 0 ? 'atencion' : undefined} />
        <StatCard etiqueta="En riesgo alto" valor={d.enRiesgoAlto} icono="bi-exclamation-octagon" tono={d.enRiesgoAlto > 0 ? 'alto' : undefined} />
        <StatCard etiqueta="Promedio de mis cursos" valor={num(d.promedioGeneral)} icono="bi-bar-chart" />
      </dl>
      <div className="dos-col">
        <section className="tarjeta">
          <h2>Alertas de estudiantes</h2>
          {d.alertas.length === 0 ? (
            <Vacio icono="bi-emoji-smile" titulo="Todo en orden" texto="Ningún estudiante está en riesgo ahora." />
          ) : (
            <ul className="lista">
              {d.alertas.map((a) => (
                <li key={`${a.estudianteId}-${a.cursoId}`}>
                  <div>
                    <strong>{a.nombre}</strong>
                    <small className="suave"> · <Link to={`/app/cursos/${a.cursoId}`}>{a.curso}</Link></small>
                    <div className="suave">Promedio {num(a.promedio)} · Asistencia {num(a.asistencia, '%')}</div>
                  </div>
                  <BadgeRiesgo nivel={a.riesgo} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="tarjeta">
          <h2>Próximas evaluaciones</h2>
          {d.proximas.length === 0 ? (
            <Vacio icono="bi-calendar2-check" titulo="Sin evaluaciones próximas" />
          ) : (
            <ul className="lista">
              {d.proximas.map((p) => (
                <li key={p.evaluacionId}>
                  <div>
                    <strong>{p.nombre}</strong>
                    <div className="suave"><Link to={`/app/cursos/${p.cursoId}`}>{p.curso}</Link> · {TIPOS_EVALUACION[p.tipo]}</div>
                  </div>
                  <Badge icono="bi-calendar-event">{fechaCorta(p.fecha)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="tarjeta">
        <h2>Promedio por curso</h2>
        <BarList filas={d.cursos.map((c) => ({ etiqueta: c.nombre, valor: c.promedio }))} />
      </section>
    </>
  )
}

function ResumenEstudiante({ d }) {
  return (
    <>
      <dl className="stats">
        <StatCard etiqueta="Mi promedio" valor={num(d.promedio)} icono="bi-bar-chart" />
        <StatCard etiqueta="Mi asistencia" valor={num(d.asistencia, '%')} icono="bi-calendar-check" />
        <StatCard etiqueta="Entregas pendientes" valor={d.pendientes.length} icono="bi-cloud-arrow-up" tono={d.pendientes.length > 0 ? 'atencion' : undefined} />
        <StatCard etiqueta="Cursos" valor={d.cursos.length} icono="bi-mortarboard" />
      </dl>
      <div className="dos-col">
        <section className="tarjeta">
          <h2>Por entregar</h2>
          {d.pendientes.length === 0 ? (
            <Vacio icono="bi-emoji-smile" titulo="Estás al día" texto="No tienes entregas pendientes." />
          ) : (
            <ul className="lista">
              {d.pendientes.map((p) => (
                <li key={p.evaluacionId}>
                  <div>
                    <strong>{p.nombre}</strong>
                    <div className="suave"><Link to={`/app/cursos/${p.cursoId}`}>{p.curso}</Link> · {TIPOS_EVALUACION[p.tipo]}</div>
                  </div>
                  <Badge tono={p.vencida ? 'alto' : 'moderado'} icono={p.vencida ? 'bi-exclamation-octagon-fill' : 'bi-clock'}>
                    {p.vencida ? 'Venció' : 'Vence'} {fechaCorta(p.fecha)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="tarjeta">
          <h2>Mi promedio por curso</h2>
          <BarList filas={d.cursos.map((c) => ({ etiqueta: c.nombre, valor: c.promedio }))} />
          <h3 className="sub">Promedio del grupo</h3>
          <BarList filas={d.cursos.map((c) => ({ etiqueta: c.nombre, valor: c.promedioGrupo, tono: 'neutro' }))} />
        </section>
      </div>
    </>
  )
}
