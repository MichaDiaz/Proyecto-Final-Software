// Los DATOS viven separados de los componentes. Así, para cambiar un texto
// no tocas el diseño, y los componentes se pueden reutilizar con otros datos.

export const roles = [
  {
    id: 'admin',
    nombre: 'Administración',
    icono: 'bi-building',
    color: '#3b5bdb',
    resumen: 'Ve el estado de toda la institución y decide quién tiene acceso.',
    puntos: [
      'Balance institucional de notas y asistencia',
      'Cuentas de docentes y estudiantes',
      'Cursos, matrículas y reporte de riesgo',
    ],
    metricas: [
      { etiqueta: 'Cuentas', valor: '18' },
      { etiqueta: 'Cursos', valor: '5' },
      { etiqueta: 'Promedio general', valor: '76.4' },
    ],
  },
  {
    id: 'docente',
    nombre: 'Docentes',
    icono: 'bi-easel',
    color: '#1f8a5b',
    resumen: 'Califica, pasa lista y recibe las tareas de sus estudiantes sin salir del curso.',
    puntos: [
      'Libro de calificaciones con promedio en vivo',
      'Tareas, proyectos y exámenes con entrega de archivos',
      'Alertas con sugerencias de intervención',
    ],
    metricas: [
      { etiqueta: 'Mis cursos', valor: '2' },
      { etiqueta: 'Entregas por revisar', valor: '7' },
      { etiqueta: 'En riesgo alto', valor: '3' },
    ],
  },
  {
    id: 'estudiante',
    nombre: 'Estudiantes',
    icono: 'bi-mortarboard',
    color: '#d97706',
    resumen: 'Consulta cómo vas en cada curso, sube tus entregas y mira qué te toca después.',
    puntos: [
      'Tu promedio y asistencia siempre al día',
      'Subes tus tareas y proyectos desde el curso',
      'Notas comparadas con el promedio del grupo',
    ],
    metricas: [
      { etiqueta: 'Mi promedio', valor: '84.2' },
      { etiqueta: 'Asistencia', valor: '92%' },
      { etiqueta: 'Entregas pendientes', valor: '2' },
    ],
  },
]

export const funcionalidades = [
  { id: 1, icono: 'bi-journal-check', titulo: 'Calificaciones en vivo', texto: 'Escribe una nota y el promedio del estudiante se recalcula al instante.' },
  { id: 2, icono: 'bi-cloud-arrow-up', titulo: 'Entrega de archivos', texto: 'Cada tarea, proyecto o examen define qué tipo de archivo recibe y hasta cuándo.' },
  { id: 3, icono: 'bi-calendar-check', titulo: 'Asistencia por sesión', texto: 'Pasa lista en un clic y marca a todos presentes si hace falta.' },
  { id: 4, icono: 'bi-exclamation-triangle', titulo: 'Alerta temprana', texto: 'Detecta quién va en riesgo por promedio o asistencia y sugiere qué hacer.' },
]