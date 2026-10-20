export default function Audiencias() {
  return (
    <section className="landing-seccion landing-proposito" aria-labelledby="titulo-proposito">
      <div className="landing-seccion-cabecera">
        <p className="landing-eyebrow">¿Para qué sirve HomeClass?</p>
        <h2 id="titulo-proposito">Para organizar la gestión académica y dar seguimiento al aprendizaje.</h2>
        <p>HomeClass reúne en una misma plataforma la información de cursos y las tareas que acompañan el ciclo académico. Está dirigida a instituciones educativas y a las personas que participan en ellas.</p>
      </div>
      <ul className="landing-proposito-puntos">
        <li><i className="bi bi-journal-check" /><span><strong>Organiza los cursos</strong><small>Centraliza espacios académicos, evaluaciones y materiales.</small></span></li>
        <li><i className="bi bi-graph-up-arrow" /><span><strong>Da seguimiento al progreso</strong><small>Facilita la consulta de calificaciones y asistencia.</small></span></li>
        <li><i className="bi bi-people" /><span><strong>Conecta a la comunidad educativa</strong><small>Ofrece herramientas según las responsabilidades de cada cuenta.</small></span></li>
      </ul>
    </section>
  )
}