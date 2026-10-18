import { useAuth } from '../context/AuthContext.jsx'
import { roles } from '../data/roles.js'
import EntregaDemo from '../components/EntregaDemo.jsx'

// Un mismo componente muestra un panel distinto según el rol de quien entró.
export default function Panel() {
  const { usuario } = useAuth()
  const rol = roles.find((r) => r.id === usuario.rol)

  return (
    <section className="panel-pagina" style={{ '--acento': rol.color }}>
      <header className="panel-cab">
        <p className="demo-etiqueta">Panel de {rol.nombre.toLowerCase()}</p>
        <h1>Hola, {usuario.nombre}</h1>
      </header>

      <dl className="balance-fila">
        {rol.metricas.map((m) => (
          <div key={m.etiqueta} className="metrica">
            <dt>{m.etiqueta}</dt>
            <dd>{m.valor}</dd>
          </div>
        ))}
      </dl>

      {/* Renderizado condicional según el rol */}
      {usuario.rol === 'admin' && <PanelAdmin />}
      {usuario.rol === 'docente' && <PanelDocente />}
      {usuario.rol === 'estudiante' && <PanelEstudiante />}
    </section>
  )
}

function Tabla({ titulo, columnas, filas }) {
  return (
    <div className="tabla-caja">
      <h2>{titulo}</h2>
      <table className="tabla">
        <thead>
          <tr>{columnas.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila[0]}>{fila.map((celda, i) => <td key={i}>{celda}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PanelAdmin() {
  return (
    <Tabla
      titulo="Cuentas recientes"
      columnas={['Nombre', 'Rol', 'Estado']}
      filas={[
        ['Ana Pérez', 'Docente', 'Activa'],
        ['Luis Gómez', 'Estudiante', 'Activa'],
        ['María Ruiz', 'Estudiante', 'Pendiente'],
      ]}
    />
  )
}

function PanelDocente() {
  return (
    <Tabla
      titulo="Entregas por revisar"
      columnas={['Estudiante', 'Evaluación', 'Entregado']}
      filas={[
        ['Luis Gómez', 'Proyecto final, entrega 2', 'Hoy'],
        ['María Ruiz', 'Tarea 4', 'Ayer'],
        ['Carlos Mena', 'Tarea 4', 'Ayer'],
      ]}
    />
  )
}

function PanelEstudiante() {
  return (
    <div className="panel-doble">
      <Tabla
        titulo="Mis cursos"
        columnas={['Curso', 'Promedio', 'Asistencia']}
        filas={[
          ['Ingeniería de Software I', '86', '95%'],
          ['Redes y Comunicación', '82', '90%'],
        ]}
      />
      <EntregaDemo />
    </div>
  )
}
