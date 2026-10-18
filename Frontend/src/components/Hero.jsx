import { Link } from 'react-router-dom'
import EntregaDemo from './EntregaDemo.jsx'

export default function Hero() {
  return (
    <section className="hero cuadricula">
      <div className="hero-texto">
        <h1>Cada clase, a un vistazo.</h1>
        <p>
          HomeClass reúne cursos, calificaciones, asistencia y entregas en un solo lugar.
          Cada persona entra a un panel hecho para lo que necesita ver y hacer.
        </p>
        {/* Si no hay sesión, /app te manda a /ingresar y luego te devuelve al panel */}
        <Link className="btn btn-tiza btn-grande" to="/app">Ingresar a mi panel</Link>
      </div>
      <EntregaDemo />
    </section>
  )
}
