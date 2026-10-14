import { funcionalidades } from '../data/roles.js'

export default function Features() {
  return (
    <section className="seccion" aria-labelledby="titulo-func">
      <h2 id="titulo-func" className="titulo-seccion">Lo que hace el día a día más simple</h2>
      <div className="rejilla">
        {funcionalidades.map((f) => (
          // {...f} pasa todas las propiedades del objeto como props
          <FeatureCard key={f.id} {...f} />
        ))}
      </div>
    </section>
  )
}

function FeatureCard({ icono, titulo, texto }) {
  return (
    <article className="feature">
      <span className="feature-icono"><i className={`bi ${icono}`} /></span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
    </article>
  )
}