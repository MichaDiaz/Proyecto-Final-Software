import { useState } from 'react'
import { roles } from '../data/roles.js'

export default function RolesTabs() {
  // Estado: guardamos SOLO el id del rol elegido, no una copia del rol.
  // El rol completo se calcula al dibujar. Regla de oro: no dupliques datos en el estado.
  const [rolId, setRolId] = useState(roles[0].id)
  const rol = roles.find((r) => r.id === rolId)

  return (
    <section className="seccion" aria-labelledby="titulo-roles">
      <h2 id="titulo-roles" className="titulo-seccion">Un panel para cada persona</h2>
      <p className="subtitulo">Elige un rol y mira qué ve al entrar.</p>

      <div className="tabs" role="tablist" aria-label="Roles de HomeClass">
        {/* CONCEPTO 2: LISTAS. map() convierte cada dato en un botón.
            'key' ayuda a React a saber cuál es cuál; debe ser único y estable. */}
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            id={`tab-${r.id}`}
            aria-selected={r.id === rolId}
            aria-controls="panel-rol"
            className={r.id === rolId ? 'tab activa' : 'tab'}
            onClick={() => setRolId(r.id)}
          >
            <i className={`bi ${r.icono}`} /> {r.nombre}
          </button>
        ))}
      </div>

      {/* style={{...}}: el primer par de llaves es "JavaScript aquí", el segundo es el objeto de estilos */}
      <div
        id="panel-rol"
        role="tabpanel"
        aria-labelledby={`tab-${rol.id}`}
        className="panel-rol"
        style={{ '--acento': rol.color }}
      >
        <div>
          <h3>{rol.nombre}</h3>
          <p className="resumen">{rol.resumen}</p>
          <ul className="puntos">
            {rol.puntos.map((punto) => (
              <li key={punto}><i className="bi bi-check2" /> {punto}</li>
            ))}
          </ul>
        </div>

        {/* CONCEPTO 6: PROPS. Pasamos datos al componente hijo como atributos. */}
        <Balance titulo="Su balance al entrar" metricas={rol.metricas} />
      </div>
    </section>
  )
}

// Un componente pequeño en el mismo archivo. Recibe PROPS (un objeto) y
// aquí las "desestructuramos" directamente en los parámetros.
function Balance({ titulo, metricas }) {
  return (
    <div className="balance">
      <p className="balance-titulo">{titulo}</p>
      <dl>
        {metricas.map((m) => (
          <div key={m.etiqueta} className="metrica">
            <dt>{m.etiqueta}</dt>
            <dd>{m.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
