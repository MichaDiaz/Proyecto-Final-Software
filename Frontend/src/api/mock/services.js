// Implementación de EJEMPLO de la API. Tiene exactamente los mismos métodos y la misma forma
// de respuesta que api/http.js (el que habla con el backend real). Cuando el backend exista,
// la interfaz no cambia: solo se apaga el mock con VITE_USE_MOCK=false.
import { leerDb, guardarDb, reiniciarDb, siguienteId } from './db.js'
import { guardarArchivo, leerArchivo, borrarArchivo } from './files.js'
import { leerToken, guardarToken, borrarToken } from '../sesion.js'
import { promedioPonderado, porcentajeAsistencia, nivelRiesgo } from '../../utils/calculos.js'
import { validarArchivo, listaExtensiones } from '../../utils/archivos.js'
import { hoyISO } from '../../utils/formato.js'

const esperar = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const fallar = (mensaje) => { throw new Error(mensaje) }

// Envuelve cada método: simula la latencia de red y lee la base fresca en cada llamada.
const conDb = (fn) => async (...args) => {
  await esperar()
  return fn(leerDb(), ...args)
}

// ---------- Auxiliares ----------
const publico = (u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, activo: u.activo })

function actual(db) {
  const u = db.usuarios.find((x) => String(x.id) === leerToken())
  return u && u.activo ? u : fallar('Tu sesión expiró. Ingresa de nuevo.')
}
function exigirRol(db, ...roles) {
  const u = actual(db)
  if (!roles.includes(u.rol)) fallar('No tienes permiso para esta acción.')
  return u
}
function exigirAccesoCurso(db, cursoId) {
  const u = actual(db)
  const curso = db.cursos.find((c) => c.id === cursoId) ?? fallar('El curso no existe.')
  const ok =
    u.rol === 'admin' ||
    (u.rol === 'docente' && curso.docenteId === u.id) ||
    (u.rol === 'estudiante' && db.inscripciones.some((i) => i.cursoId === cursoId && i.estudianteId === u.id))
  if (!ok) fallar('No tienes acceso a este curso.')
  return { u, curso }
}

const nombreDe = (db, id) => db.usuarios.find((u) => u.id === id)?.nombre ?? '—'
const estudiantesDe = (db, cursoId) =>
  db.inscripciones.filter((i) => i.cursoId === cursoId)
    .map((i) => db.usuarios.find((u) => u.id === i.estudianteId)).filter(Boolean)
const evaluacionesDe = (db, cursoId) => db.evaluaciones.filter((e) => e.cursoId === cursoId).sort((a, b) => a.fecha.localeCompare(b.fecha))
const notaDe = (db, evId, estId) => db.calificaciones.find((c) => c.evaluacionId === evId && c.estudianteId === estId)?.nota ?? null
const entregaDe = (db, evId, estId) => db.entregas.find((e) => e.evaluacionId === evId && e.estudianteId === estId) ?? null

function promedioDe(db, cursoId, estId) {
  return promedioPonderado(evaluacionesDe(db, cursoId).map((e) => ({ peso: e.peso, nota: notaDe(db, e.id, estId) })))
}
function asistenciaDe(db, cursoId, estId) {
  return porcentajeAsistencia(db.asistencias.filter((a) => a.cursoId === cursoId && a.estudianteId === estId))
}
const media = (lista) => {
  const v = lista.filter((n) => n !== null)
  return v.length ? Math.round((v.reduce((s, n) => s + n, 0) / v.length) * 10) / 10 : null
}

function resumenCurso(db, curso) {
  const ests = estudiantesDe(db, curso.id)
  const proms = ests.map((e) => promedioDe(db, curso.id, e.id))
  const asist = ests.map((e) => asistenciaDe(db, curso.id, e.id))
  const riesgos = ests.map((e, i) => nivelRiesgo(proms[i], asist[i]))
  return {
    id: curso.id, codigo: curso.codigo, nombre: curso.nombre, periodo: curso.periodo,
    docenteId: curso.docenteId, docente: nombreDe(db, curso.docenteId),
    estudiantes: ests.length, promedio: media(proms), asistencia: media(asist),
    enRiesgo: riesgos.filter((r) => r === 'alto').length,
  }
}

function archivoDeMuestra(nombre) {
  return new Blob([`Archivo de ejemplo generado por HomeClass (modo demostración).\nNombre: ${nombre}\n`], { type: 'text/plain' })
}

function validarEvaluacion(ev) {
  if (!ev.nombre?.trim()) fallar('El nombre de la evaluación es obligatorio.')
  if (!['tarea', 'proyecto', 'examen'].includes(ev.tipo)) fallar('Tipo de evaluación inválido.')
  if (!(ev.peso > 0 && ev.peso <= 100)) fallar('El peso debe estar entre 1 y 100.')
  if (!ev.fecha) fallar('La fecha es obligatoria.')
  if (ev.requiereEntrega) {
    if (!listaExtensiones(ev.extensiones || '').length) fallar('Indica al menos una extensión permitida.')
    if (!(ev.maxMb > 0 && ev.maxMb <= 25)) fallar('El tamaño máximo debe estar entre 1 y 25 MB.')
  }
}

// ---------- Autenticación ----------
const auth = {
  login: async (correo, clave) => {
    await esperar(250)
    const db = leerDb()
    const u = db.usuarios.find((x) => x.correo === correo.trim().toLowerCase() && x.clave === clave)
    if (!u) fallar('Correo o contraseña incorrectos.')
    if (!u.activo) fallar('Tu cuenta está desactivada. Contacta a administración.')
    guardarToken(String(u.id))
    return { token: String(u.id), usuario: publico(u) }
  },
  sesion: conDb((db) => publico(actual(db))),
  salir: async () => { borrarToken() },
  reiniciarDemo: async () => { reiniciarDb() },
}

// ---------- Dashboard (un resumen distinto por rol) ----------
const dashboard = {
  obtener: conDb((db) => {
    const u = actual(db)
    const hoy = hoyISO()

    if (u.rol === 'admin') {
      const cursos = db.cursos.map((c) => resumenCurso(db, c))
      const riesgo = { alto: 0, moderado: 0, bajo: 0 }
      for (const i of db.inscripciones) {
        const r = nivelRiesgo(promedioDe(db, i.cursoId, i.estudianteId), asistenciaDe(db, i.cursoId, i.estudianteId))
        if (riesgo[r] !== undefined) riesgo[r]++
      }
      return {
        rol: 'admin',
        usuarios: {
          total: db.usuarios.length,
          admins: db.usuarios.filter((x) => x.rol === 'admin').length,
          docentes: db.usuarios.filter((x) => x.rol === 'docente').length,
          estudiantes: db.usuarios.filter((x) => x.rol === 'estudiante').length,
          inactivos: db.usuarios.filter((x) => !x.activo).length,
        },
        cursos,
        promedioGeneral: media(cursos.map((c) => c.promedio)),
        asistenciaGeneral: media(cursos.map((c) => c.asistencia)),
        riesgo,
      }
    }

    if (u.rol === 'docente') {
      const mios = db.cursos.filter((c) => c.docenteId === u.id)
      const cursos = mios.map((c) => resumenCurso(db, c))
      const alertas = []
      let porRevisar = 0
      const proximas = []
      for (const c of mios) {
        for (const e of estudiantesDe(db, c.id)) {
          const prom = promedioDe(db, c.id, e.id)
          const asist = asistenciaDe(db, c.id, e.id)
          const riesgo = nivelRiesgo(prom, asist)
          if (riesgo === 'alto' || riesgo === 'moderado') {
            alertas.push({ estudianteId: e.id, nombre: e.nombre, cursoId: c.id, curso: c.nombre, riesgo, promedio: prom, asistencia: asist })
          }
        }
        for (const ev of evaluacionesDe(db, c.id)) {
          if (ev.requiereEntrega) {
            porRevisar += db.entregas.filter((en) => en.evaluacionId === ev.id && notaDe(db, ev.id, en.estudianteId) === null).length
          }
          if (ev.fecha >= hoy) proximas.push({ evaluacionId: ev.id, cursoId: c.id, curso: c.nombre, nombre: ev.nombre, tipo: ev.tipo, fecha: ev.fecha })
        }
      }
      alertas.sort((a, b) => (a.riesgo === b.riesgo ? 0 : a.riesgo === 'alto' ? -1 : 1))
      proximas.sort((a, b) => a.fecha.localeCompare(b.fecha))
      return {
        rol: 'docente', cursos, porRevisar,
        enRiesgoAlto: alertas.filter((a) => a.riesgo === 'alto').length,
        promedioGeneral: media(cursos.map((c) => c.promedio)),
        alertas: alertas.slice(0, 8), proximas: proximas.slice(0, 6),
      }
    }

    // estudiante
    const mios = db.inscripciones.filter((i) => i.estudianteId === u.id).map((i) => db.cursos.find((c) => c.id === i.cursoId))
    const cursos = mios.map((c) => {
      const prom = promedioDe(db, c.id, u.id)
      const asist = asistenciaDe(db, c.id, u.id)
      const grupo = media(estudiantesDe(db, c.id).map((e) => promedioDe(db, c.id, e.id)))
      return { id: c.id, nombre: c.nombre, promedio: prom, promedioGrupo: grupo, asistencia: asist, riesgo: nivelRiesgo(prom, asist) }
    })
    const pendientes = []
    for (const c of mios) {
      for (const ev of evaluacionesDe(db, c.id)) {
        const calificada = notaDe(db, ev.id, u.id) !== null
        if (calificada) continue
        if (ev.requiereEntrega && !entregaDe(db, ev.id, u.id)) {
          pendientes.push({ evaluacionId: ev.id, cursoId: c.id, curso: c.nombre, nombre: ev.nombre, tipo: ev.tipo, fecha: ev.fecha, vencida: ev.fecha < hoy })
        }
      }
    }
    pendientes.sort((a, b) => a.fecha.localeCompare(b.fecha))
    return {
      rol: 'estudiante', cursos, pendientes,
      promedio: media(cursos.map((c) => c.promedio)),
      asistencia: media(cursos.map((c) => c.asistencia)),
    }
  }),
}

// ---------- Usuarios (solo administración) ----------
const usuarios = {
  listar: conDb((db) => { exigirRol(db, 'admin'); return db.usuarios.map(publico) }),
  crear: conDb((db, datos) => {
    exigirRol(db, 'admin')
    const correo = datos.correo?.trim().toLowerCase()
    if (!datos.nombre?.trim() || !correo) fallar('Nombre y correo son obligatorios.')
    if (!/^\S+@\S+\.\S+$/.test(correo)) fallar('El correo no es válido.')
    if (db.usuarios.some((u) => u.correo === correo)) fallar('Ya existe una cuenta con ese correo.')
    if (!datos.clave || datos.clave.length < 8) fallar('La contraseña debe tener al menos 8 caracteres.')
    const nuevo = { id: siguienteId(db, 'usuario'), nombre: datos.nombre.trim(), correo, clave: datos.clave, rol: datos.rol, activo: true }
    db.usuarios.push(nuevo)
    guardarDb(db)
    return publico(nuevo)
  }),
  actualizar: conDb((db, id, datos) => {
    const yo = exigirRol(db, 'admin')
    const u = db.usuarios.find((x) => x.id === id) ?? fallar('El usuario no existe.')
    const correo = datos.correo?.trim().toLowerCase()
    if (!datos.nombre?.trim() || !correo) fallar('Nombre y correo son obligatorios.')
    if (db.usuarios.some((x) => x.correo === correo && x.id !== id)) fallar('Ya existe una cuenta con ese correo.')
    if (u.id === yo.id && (datos.activo === false || datos.rol !== u.rol)) fallar('No puedes desactivarte ni cambiar tu propio rol.')
    Object.assign(u, { nombre: datos.nombre.trim(), correo, rol: datos.rol ?? u.rol, activo: datos.activo ?? u.activo })
    guardarDb(db)
    return publico(u)
  }),
  eliminar: conDb(async (db, id) => {
    const yo = exigirRol(db, 'admin')
    if (id === yo.id) fallar('No puedes eliminar tu propia cuenta.')
    const u = db.usuarios.find((x) => x.id === id) ?? fallar('El usuario no existe.')
    if (u.rol === 'docente' && db.cursos.some((c) => c.docenteId === id)) fallar('Ese docente tiene cursos asignados. Reasígnalos primero.')
    for (const e of db.entregas.filter((x) => x.estudianteId === id)) await borrarArchivo(e.archivoId)
    db.entregas = db.entregas.filter((e) => e.estudianteId !== id)
    db.calificaciones = db.calificaciones.filter((c) => c.estudianteId !== id)
    db.asistencias = db.asistencias.filter((a) => a.estudianteId !== id)
    db.inscripciones = db.inscripciones.filter((i) => i.estudianteId !== id)
    db.usuarios = db.usuarios.filter((x) => x.id !== id)
    guardarDb(db)
  }),
}

// ---------- Perfil ----------
const perfil = {
  actualizar: conDb((db, { nombre }) => {
    const u = actual(db)
    if (!nombre?.trim()) fallar('El nombre es obligatorio.')
    u.nombre = nombre.trim()
    guardarDb(db)
    return publico(u)
  }),
  cambiarClave: conDb((db, { actual: claveActual, nueva }) => {
    const u = actual(db)
    if (u.clave !== claveActual) fallar('La contraseña actual no es correcta.')
    if (!nueva || nueva.length < 8) fallar('La nueva contraseña debe tener al menos 8 caracteres.')
    u.clave = nueva
    guardarDb(db)
  }),
}

// ---------- Cursos ----------
const cursos = {
  listar: conDb((db) => {
    const u = actual(db)
    let lista = db.cursos
    if (u.rol === 'docente') lista = lista.filter((c) => c.docenteId === u.id)
    if (u.rol === 'estudiante') lista = lista.filter((c) => db.inscripciones.some((i) => i.cursoId === c.id && i.estudianteId === u.id))
    return lista.map((c) => {
      const r = resumenCurso(db, c)
      if (u.rol === 'estudiante') {
        const prom = promedioDe(db, c.id, u.id)
        const asist = asistenciaDe(db, c.id, u.id)
        return { ...r, promedio: prom, asistencia: asist, riesgo: nivelRiesgo(prom, asist) }
      }
      return r
    })
  }),
  obtener: conDb((db, id) => {
    const { u, curso } = exigirAccesoCurso(db, id)
    return {
      id: curso.id, codigo: curso.codigo, nombre: curso.nombre, periodo: curso.periodo,
      descripcion: curso.descripcion, docenteId: curso.docenteId, docente: nombreDe(db, curso.docenteId),
      estudiantes: u.rol === 'estudiante' ? [] : estudiantesDe(db, id).map((e) => ({ id: e.id, nombre: e.nombre, correo: e.correo })),
    }
  }),
  crear: conDb((db, datos) => {
    exigirRol(db, 'admin')
    if (!datos.nombre?.trim() || !datos.codigo?.trim()) fallar('Código y nombre son obligatorios.')
    if (db.cursos.some((c) => c.codigo.toLowerCase() === datos.codigo.trim().toLowerCase())) fallar('Ya existe un curso con ese código.')
    if (!db.usuarios.some((u) => u.id === datos.docenteId && u.rol === 'docente')) fallar('Elige un docente válido.')
    const c = { id: siguienteId(db, 'curso'), codigo: datos.codigo.trim(), nombre: datos.nombre.trim(), docenteId: datos.docenteId, periodo: datos.periodo?.trim() || '2026-II', descripcion: datos.descripcion?.trim() || '' }
    db.cursos.push(c)
    guardarDb(db)
    return c
  }),
  actualizar: conDb((db, id, datos) => {
    exigirRol(db, 'admin')
    const c = db.cursos.find((x) => x.id === id) ?? fallar('El curso no existe.')
    if (!datos.nombre?.trim() || !datos.codigo?.trim()) fallar('Código y nombre son obligatorios.')
    if (db.cursos.some((x) => x.id !== id && x.codigo.toLowerCase() === datos.codigo.trim().toLowerCase())) fallar('Ya existe un curso con ese código.')
    if (!db.usuarios.some((u) => u.id === datos.docenteId && u.rol === 'docente')) fallar('Elige un docente válido.')
    Object.assign(c, { codigo: datos.codigo.trim(), nombre: datos.nombre.trim(), docenteId: datos.docenteId, periodo: datos.periodo?.trim() || c.periodo, descripcion: datos.descripcion?.trim() || '' })
    guardarDb(db)
    return c
  }),
  eliminar: conDb(async (db, id) => {
    exigirRol(db, 'admin')
    if (!db.cursos.some((c) => c.id === id)) fallar('El curso no existe.')
    const evIds = db.evaluaciones.filter((e) => e.cursoId === id).map((e) => e.id)
    for (const e of db.entregas.filter((x) => evIds.includes(x.evaluacionId))) await borrarArchivo(e.archivoId)
    for (const m of db.materiales.filter((x) => x.cursoId === id)) await borrarArchivo(m.archivoId)
    db.entregas = db.entregas.filter((e) => !evIds.includes(e.evaluacionId))
    db.calificaciones = db.calificaciones.filter((c) => !evIds.includes(c.evaluacionId))
    db.evaluaciones = db.evaluaciones.filter((e) => e.cursoId !== id)
    db.materiales = db.materiales.filter((m) => m.cursoId !== id)
    db.asistencias = db.asistencias.filter((a) => a.cursoId !== id)
    db.inscripciones = db.inscripciones.filter((i) => i.cursoId !== id)
    db.cursos = db.cursos.filter((c) => c.id !== id)
    guardarDb(db)
  }),
  matricular: conDb((db, cursoId, estudianteId) => {
    exigirRol(db, 'admin')
    if (!db.usuarios.some((u) => u.id === estudianteId && u.rol === 'estudiante')) fallar('Elige un estudiante válido.')
    if (db.inscripciones.some((i) => i.cursoId === cursoId && i.estudianteId === estudianteId)) fallar('Ya está matriculado en el curso.')
    db.inscripciones.push({ cursoId, estudianteId })
    guardarDb(db)
  }),
  desmatricular: conDb(async (db, cursoId, estudianteId) => {
    exigirRol(db, 'admin')
    const evIds = evaluacionesDe(db, cursoId).map((e) => e.id)
    for (const e of db.entregas.filter((x) => evIds.includes(x.evaluacionId) && x.estudianteId === estudianteId)) await borrarArchivo(e.archivoId)
    db.entregas = db.entregas.filter((e) => !(evIds.includes(e.evaluacionId) && e.estudianteId === estudianteId))
    db.calificaciones = db.calificaciones.filter((c) => !(evIds.includes(c.evaluacionId) && c.estudianteId === estudianteId))
    db.asistencias = db.asistencias.filter((a) => !(a.cursoId === cursoId && a.estudianteId === estudianteId))
    db.inscripciones = db.inscripciones.filter((i) => !(i.cursoId === cursoId && i.estudianteId === estudianteId))
    guardarDb(db)
  }),

  // Vista del estudiante dentro de un curso: sus notas, entregas y materiales.
  miCurso: conDb((db, cursoId) => {
    const { u, curso } = exigirAccesoCurso(db, cursoId)
    if (u.rol !== 'estudiante') fallar('Solo para estudiantes.')
    const hoy = hoyISO()
    const prom = promedioDe(db, cursoId, u.id)
    const asist = asistenciaDe(db, cursoId, u.id)
    const evaluaciones = evaluacionesDe(db, cursoId).map((ev) => {
      const nota = notaDe(db, ev.id, u.id)
      const en = entregaDe(db, ev.id, u.id)
      let estado = 'pendiente'
      if (nota !== null) estado = 'calificada'
      else if (en) estado = 'entregada'
      else if (ev.fecha < hoy && ev.requiereEntrega) estado = 'vencida'
      return { ...ev, nota, estado, entrega: en ? { ...en, archivoId: undefined } : null }
    })
    return {
      curso: { id: curso.id, codigo: curso.codigo, nombre: curso.nombre, descripcion: curso.descripcion, periodo: curso.periodo, docente: nombreDe(db, curso.docenteId) },
      promedio: prom, asistencia: asist, riesgo: nivelRiesgo(prom, asist),
      promedioGrupo: media(estudiantesDe(db, cursoId).map((e) => promedioDe(db, cursoId, e.id))),
      evaluaciones,
    }
  }),
}

// ---------- Evaluaciones ----------
const evaluaciones = {
  listar: conDb((db, cursoId) => { exigirAccesoCurso(db, cursoId); return evaluacionesDe(db, cursoId) }),
  guardar: conDb((db, cursoId, datos) => {
    const { u, curso } = exigirAccesoCurso(db, cursoId)
    if (u.rol !== 'docente') fallar('Solo el docente del curso puede editar evaluaciones.')
    validarEvaluacion(datos)
    const otros = evaluacionesDe(db, cursoId).filter((e) => e.id !== datos.id).reduce((s, e) => s + e.peso, 0)
    if (otros + Number(datos.peso) > 100) fallar(`Los pesos del curso no pueden pasar de 100% (ya hay ${otros}%).`)
    const limpio = {
      cursoId: curso.id, nombre: datos.nombre.trim(), tipo: datos.tipo, peso: Number(datos.peso), fecha: datos.fecha,
      instrucciones: datos.instrucciones?.trim() || '', requiereEntrega: !!datos.requiereEntrega,
      extensiones: datos.requiereEntrega ? listaExtensiones(datos.extensiones).join(',') : '',
      maxMb: datos.requiereEntrega ? Number(datos.maxMb) : 10, permiteTardia: !!datos.permiteTardia,
    }
    if (datos.id) {
      const ev = db.evaluaciones.find((e) => e.id === datos.id && e.cursoId === cursoId) ?? fallar('La evaluación no existe.')
      Object.assign(ev, limpio)
      guardarDb(db)
      return ev
    }
    const nueva = { id: siguienteId(db, 'evaluacion'), ...limpio }
    db.evaluaciones.push(nueva)
    guardarDb(db)
    return nueva
  }),
  eliminar: conDb(async (db, id) => {
    const ev = db.evaluaciones.find((e) => e.id === id) ?? fallar('La evaluación no existe.')
    const { u } = exigirAccesoCurso(db, ev.cursoId)
    if (u.rol !== 'docente') fallar('Solo el docente del curso puede eliminar evaluaciones.')
    for (const e of db.entregas.filter((x) => x.evaluacionId === id)) await borrarArchivo(e.archivoId)
    db.entregas = db.entregas.filter((e) => e.evaluacionId !== id)
    db.calificaciones = db.calificaciones.filter((c) => c.evaluacionId !== id)
    db.evaluaciones = db.evaluaciones.filter((e) => e.id !== id)
    guardarDb(db)
  }),
}

// ---------- Calificaciones ----------
const calificaciones = {
  libro: conDb((db, cursoId) => {
    const { u } = exigirAccesoCurso(db, cursoId)
    if (u.rol === 'estudiante') fallar('No tienes acceso al libro de calificaciones.')
    const evs = evaluacionesDe(db, cursoId)
    const filas = estudiantesDe(db, cursoId).map((e) => {
      const prom = promedioDe(db, cursoId, e.id)
      const asist = asistenciaDe(db, cursoId, e.id)
      return {
        estudianteId: e.id, nombre: e.nombre, promedio: prom, asistencia: asist, riesgo: nivelRiesgo(prom, asist),
        notas: Object.fromEntries(evs.map((ev) => [ev.id, notaDe(db, ev.id, e.id)])),
        entregas: Object.fromEntries(evs.filter((ev) => ev.requiereEntrega).map((ev) => [ev.id, !!entregaDe(db, ev.id, e.id)])),
      }
    })
    return { evaluaciones: evs, filas }
  }),
  guardarNota: conDb((db, evaluacionId, estudianteId, nota) => {
    const ev = db.evaluaciones.find((e) => e.id === evaluacionId) ?? fallar('La evaluación no existe.')
    const { u } = exigirAccesoCurso(db, ev.cursoId)
    if (u.rol !== 'docente') fallar('Solo el docente del curso puede calificar.')
    if (!db.inscripciones.some((i) => i.cursoId === ev.cursoId && i.estudianteId === estudianteId)) fallar('El estudiante no está en el curso.')
    if (nota !== null && !(Number.isFinite(nota) && nota >= 0 && nota <= 100)) fallar('La nota debe estar entre 0 y 100.')
    db.calificaciones = db.calificaciones.filter((c) => !(c.evaluacionId === evaluacionId && c.estudianteId === estudianteId))
    if (nota !== null) db.calificaciones.push({ evaluacionId, estudianteId, nota })
    guardarDb(db)
    const prom = promedioDe(db, ev.cursoId, estudianteId)
    const asist = asistenciaDe(db, ev.cursoId, estudianteId)
    return { promedio: prom, riesgo: nivelRiesgo(prom, asist) }
  }),
}

// ---------- Asistencia ----------
const asistencia = {
  obtener: conDb((db, cursoId, fecha) => {
    const { u } = exigirAccesoCurso(db, cursoId)
    if (u.rol === 'estudiante') fallar('No tienes acceso a esta lista.')
    const registrada = db.asistencias.some((a) => a.cursoId === cursoId && a.fecha === fecha)
    const registros = estudiantesDe(db, cursoId).map((e) => ({
      estudianteId: e.id, nombre: e.nombre,
      presente: db.asistencias.find((a) => a.cursoId === cursoId && a.fecha === fecha && a.estudianteId === e.id)?.presente ?? true,
    }))
    return { fecha, registrada, registros }
  }),
  guardar: conDb((db, cursoId, fecha, registros) => {
    const { u } = exigirAccesoCurso(db, cursoId)
    if (u.rol !== 'docente') fallar('Solo el docente del curso puede pasar lista.')
    if (!fecha) fallar('Elige una fecha.')
    const validos = new Set(estudiantesDe(db, cursoId).map((e) => e.id))
    db.asistencias = db.asistencias.filter((a) => !(a.cursoId === cursoId && a.fecha === fecha))
    for (const r of registros) if (validos.has(r.estudianteId)) db.asistencias.push({ cursoId, fecha, estudianteId: r.estudianteId, presente: !!r.presente })
    guardarDb(db)
  }),
}

// ---------- Materiales (archivos que sube el docente) ----------
const publicoMaterial = ({ archivoId, ...m }) => m
const materiales = {
  listar: conDb((db, cursoId) => {
    exigirAccesoCurso(db, cursoId)
    return db.materiales.filter((m) => m.cursoId === cursoId).sort((a, b) => b.fecha.localeCompare(a.fecha)).map(publicoMaterial)
  }),
  subir: conDb(async (db, cursoId, titulo, archivo) => {
    const { u } = exigirAccesoCurso(db, cursoId)
    if (u.rol !== 'docente') fallar('Solo el docente del curso puede subir materiales.')
    if (!titulo?.trim()) fallar('Escribe un título para el material.')
    const error = validarArchivo(archivo, { maxMb: 25 })
    if (error) fallar(error)
    const m = { id: siguienteId(db, 'material'), cursoId, titulo: titulo.trim(), nombreOriginal: archivo.name, tamano: archivo.size, fecha: new Date().toISOString(), archivoId: await guardarArchivo(archivo) }
    db.materiales.push(m)
    guardarDb(db)
    return publicoMaterial(m)
  }),
  eliminar: conDb(async (db, id) => {
    const m = db.materiales.find((x) => x.id === id) ?? fallar('El material no existe.')
    const { u } = exigirAccesoCurso(db, m.cursoId)
    if (u.rol !== 'docente') fallar('Solo el docente del curso puede eliminar materiales.')
    await borrarArchivo(m.archivoId)
    db.materiales = db.materiales.filter((x) => x.id !== id)
    guardarDb(db)
  }),
  descargar: conDb(async (db, id) => {
    const m = db.materiales.find((x) => x.id === id) ?? fallar('El material no existe.')
    exigirAccesoCurso(db, m.cursoId)
    return { blob: (await leerArchivo(m.archivoId)) ?? archivoDeMuestra(m.nombreOriginal), nombre: m.nombreOriginal }
  }),
}

// ---------- Entregas (archivos que suben los estudiantes) ----------
const publicoEntrega = ({ archivoId, ...e }) => e
const entregas = {
  // Docente: quién entregó y quién no, con su nota.
  listarPorEvaluacion: conDb((db, evaluacionId) => {
    const ev = db.evaluaciones.find((e) => e.id === evaluacionId) ?? fallar('La evaluación no existe.')
    const { u } = exigirAccesoCurso(db, ev.cursoId)
    if (u.rol === 'estudiante') fallar('No tienes permiso.')
    return {
      evaluacion: ev,
      filas: estudiantesDe(db, ev.cursoId).map((e) => {
        const en = entregaDe(db, evaluacionId, e.id)
        return { estudianteId: e.id, nombre: e.nombre, entrega: en ? publicoEntrega(en) : null, nota: notaDe(db, evaluacionId, e.id) }
      }),
    }
  }),
  entregar: conDb(async (db, evaluacionId, archivo, comentario) => {
    const ev = db.evaluaciones.find((e) => e.id === evaluacionId) ?? fallar('La evaluación no existe.')
    const { u } = exigirAccesoCurso(db, ev.cursoId)
    if (u.rol !== 'estudiante') fallar('Solo los estudiantes entregan trabajos.')
    if (!ev.requiereEntrega) fallar('Esta evaluación no recibe archivos.')
    if (notaDe(db, evaluacionId, u.id) !== null) fallar('Ya fue calificada: no se puede cambiar la entrega.')
    const tardia = ev.fecha < hoyISO()
    if (tardia && !ev.permiteTardia) fallar('El plazo de entrega terminó.')
    const error = validarArchivo(archivo, { extensiones: listaExtensiones(ev.extensiones), maxMb: ev.maxMb })
    if (error) fallar(error)
    const previa = entregaDe(db, evaluacionId, u.id)
    if (previa) {
      await borrarArchivo(previa.archivoId)
      db.entregas = db.entregas.filter((e) => e.id !== previa.id)
    }
    const nueva = {
      id: siguienteId(db, 'entrega'), evaluacionId, estudianteId: u.id, nombreOriginal: archivo.name, tamano: archivo.size,
      fecha: new Date().toISOString(), tardia, comentario: comentario?.trim() || '', archivoId: await guardarArchivo(archivo),
    }
    db.entregas.push(nueva)
    guardarDb(db)
    return publicoEntrega(nueva)
  }),
  retirar: conDb(async (db, evaluacionId) => {
    const ev = db.evaluaciones.find((e) => e.id === evaluacionId) ?? fallar('La evaluación no existe.')
    const { u } = exigirAccesoCurso(db, ev.cursoId)
    if (u.rol !== 'estudiante') fallar('Solo los estudiantes retiran su entrega.')
    if (notaDe(db, evaluacionId, u.id) !== null) fallar('Ya fue calificada: no se puede retirar la entrega.')
    const previa = entregaDe(db, evaluacionId, u.id) ?? fallar('No tienes una entrega para retirar.')
    await borrarArchivo(previa.archivoId)
    db.entregas = db.entregas.filter((e) => e.id !== previa.id)
    guardarDb(db)
  }),
  descargar: conDb(async (db, id) => {
    const en = db.entregas.find((e) => e.id === id) ?? fallar('La entrega no existe.')
    const ev = db.evaluaciones.find((e) => e.id === en.evaluacionId)
    const { u } = exigirAccesoCurso(db, ev.cursoId)
    if (u.rol === 'estudiante' && en.estudianteId !== u.id) fallar('No tienes permiso para ver esa entrega.')
    return { blob: (await leerArchivo(en.archivoId)) ?? archivoDeMuestra(en.nombreOriginal), nombre: en.nombreOriginal }
  }),
}

export const mockApi = { auth, dashboard, usuarios, perfil, cursos, evaluaciones, calificaciones, asistencia, materiales, entregas }
