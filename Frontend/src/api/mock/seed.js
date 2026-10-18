import { hoyISO, sumarDias } from '../../utils/formato.js'

// Datos de ejemplo iniciales. Las contraseñas en claro SOLO existen en el mock.
export function crearSeed() {
  const hoy = hoyISO()

  const usuarios = [
    { id: 1, nombre: 'Administración', correo: 'admin@homeclass.edu', clave: 'Admin#2026', rol: 'admin', activo: true },
    { id: 2, nombre: 'Docente de ejemplo', correo: 'docente@homeclass.edu', clave: 'Docente#2026', rol: 'docente', activo: true },
    { id: 3, nombre: 'Elena Castillo', correo: 'elena@homeclass.edu', clave: 'Docente#2026', rol: 'docente', activo: true },
    { id: 4, nombre: 'Estudiante de ejemplo', correo: 'estudiante@homeclass.edu', clave: 'Estudiante#2026', rol: 'estudiante', activo: true },
    { id: 5, nombre: 'Luis Gómez', correo: 'luis@homeclass.edu', clave: 'Estudiante#2026', rol: 'estudiante', activo: true },
    { id: 6, nombre: 'María Ruiz', correo: 'maria@homeclass.edu', clave: 'Estudiante#2026', rol: 'estudiante', activo: true },
    { id: 7, nombre: 'Carlos Mena', correo: 'carlos@homeclass.edu', clave: 'Estudiante#2026', rol: 'estudiante', activo: true },
    { id: 8, nombre: 'Ana Torres', correo: 'ana@homeclass.edu', clave: 'Estudiante#2026', rol: 'estudiante', activo: true },
    { id: 9, nombre: 'Sofía Díaz', correo: 'sofia@homeclass.edu', clave: 'Estudiante#2026', rol: 'estudiante', activo: true },
    { id: 10, nombre: 'Diego Rivas', correo: 'diego@homeclass.edu', clave: 'Estudiante#2026', rol: 'estudiante', activo: false },
  ]

  const cursos = [
    { id: 1, codigo: 'ISW-101', nombre: 'Ingeniería de Software I', docenteId: 2, periodo: '2026-II', descripcion: 'Modelo en cascada, UML y gestión de proyectos de software.' },
    { id: 2, codigo: 'RED-201', nombre: 'Redes y Comunicación', docenteId: 2, periodo: '2026-II', descripcion: 'Modelo OSI, direccionamiento IP y configuración de redes.' },
    { id: 3, codigo: 'BDD-110', nombre: 'Bases de Datos', docenteId: 3, periodo: '2026-II', descripcion: 'Modelo entidad-relación, SQL y normalización.' },
  ]

  const matriculas = {
    1: [4, 5, 6, 7, 8, 9],
    2: [4, 5, 6, 7],
    3: [4, 6, 8, 9, 10],
  }
  const inscripciones = Object.entries(matriculas).flatMap(([cursoId, ids]) =>
    ids.map((estudianteId) => ({ cursoId: Number(cursoId), estudianteId })),
  )

  // Por curso: nombre, tipo, peso, días respecto a hoy, ¿pide entrega?
  const plan = [
    ['Tarea 1', 'tarea', 15, -30, true],
    ['Examen parcial', 'examen', 30, -14, false],
    ['Proyecto: entrega 1', 'proyecto', 25, -5, true],
    ['Proyecto final', 'proyecto', 30, 12, true],
  ]
  const evaluaciones = []
  let idEv = 1
  for (const curso of cursos) {
    for (const [nombre, tipo, peso, dias, requiereEntrega] of plan) {
      evaluaciones.push({
        id: idEv++, cursoId: curso.id, nombre, tipo, peso, fecha: sumarDias(hoy, dias),
        instrucciones: requiereEntrega ? 'Sube tu trabajo en el formato indicado. Se revisa la ortografía y el orden.' : '',
        requiereEntrega, extensiones: 'pdf,docx,zip', maxMb: 10, permiteTardia: tipo === 'tarea',
      })
    }
  }

  // Notas deterministas (sin azar) para que los datos de ejemplo siempre sean iguales.
  const calificaciones = []
  for (const ev of evaluaciones) {
    if (ev.fecha > hoy) continue
    for (const { estudianteId } of inscripciones.filter((i) => i.cursoId === ev.cursoId)) {
      const base = 58 + ((estudianteId * 17 + ev.id * 11) % 40)
      const nota = estudianteId === 7 ? Math.min(base, 66) : Math.max(base, 62)
      calificaciones.push({ evaluacionId: ev.id, estudianteId, nota })
    }
  }

  // Asistencia: 6 sesiones por curso. Carlos Mena (7) falta bastante.
  const asistencias = []
  for (const curso of cursos) {
    for (let s = 0; s < 6; s++) {
      const fecha = sumarDias(hoy, -35 + s * 6)
      for (const { estudianteId } of inscripciones.filter((i) => i.cursoId === curso.id)) {
        const presente = estudianteId === 7 ? s % 2 === 0 && s !== 4 : (s + estudianteId * 3) % 9 !== 0
        asistencias.push({ cursoId: curso.id, fecha, estudianteId, presente })
      }
    }
  }

  // Entregas de ejemplo (sin archivo real: el mock genera un archivo de muestra al descargar).
  const entregas = []
  let idEn = 1
  for (const ev of evaluaciones.filter((e) => e.requiereEntrega && e.fecha <= hoy)) {
    for (const { estudianteId } of inscripciones.filter((i) => i.cursoId === ev.cursoId)) {
      if (estudianteId === 7 && ev.nombre === 'Tarea 1') continue
      entregas.push({
        id: idEn++, evaluacionId: ev.id, estudianteId, nombreOriginal: `entrega-${estudianteId}.pdf`,
        tamano: 180000 + estudianteId * 9000, fecha: `${sumarDias(ev.fecha, -1)}T15:00:00`,
        tardia: false, comentario: '', archivoId: null,
      })
    }
  }

  const materiales = [
    { id: 1, cursoId: 1, titulo: 'Guía del proyecto final', nombreOriginal: 'guia-proyecto.pdf', tamano: 420000, fecha: `${sumarDias(hoy, -20)}T10:00:00`, archivoId: null },
    { id: 2, cursoId: 2, titulo: 'Presentación: Modelo OSI', nombreOriginal: 'modelo-osi.pdf', tamano: 880000, fecha: `${sumarDias(hoy, -18)}T10:00:00`, archivoId: null },
  ]

  return {
    version: 1, usuarios, cursos, inscripciones, evaluaciones, calificaciones, asistencias, entregas, materiales,
    contadores: { usuario: 11, curso: 4, evaluacion: idEv, entrega: idEn, material: 3 },
  }
}
