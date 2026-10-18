import { Link } from 'react-router-dom'

export default function NoEncontrada() {
  return (
    <section className="login">
      <h1>Página no encontrada</h1>
      <p className="suave">Esa dirección no existe en HomeClass.</p>
      <Link className="btn btn-primario" to="/">Volver al inicio</Link>
    </section>
  )
}
