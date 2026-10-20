import Hero from '../components/Hero.jsx'
import Audiencias from '../components/Audiencias.jsx'
import Features from '../components/Features.jsx'
import { Link } from 'react-router-dom'

export default function Inicio() {
  return (
    <div className="inicio">
      <Hero />
      <Audiencias />
      <Features />
      <section className="inicio-cierre" aria-labelledby="titulo-cierre">
        <div>
          <p className="landing-eyebrow">HomeClass</p>
          <h2 id="titulo-cierre">Más claridad para acompañar cada curso.</h2>
          <p>Consulta el espacio académico de tu institución desde un solo lugar.</p>
        </div>
        <Link className="btn btn-landing" to="/ingresar">Ingresar a HomeClass <i className="bi bi-arrow-right" /></Link>
      </section>
    </div>
  )
}
