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
        <a className="btn btn-tiza btn-grande" href="/Cuenta/Ingresar">Ingresar a mi panel</a>
      </div>

      {/* Un componente se usa como una etiqueta HTML propia */}
      <EntregaDemo />
    </section>
  )
}
