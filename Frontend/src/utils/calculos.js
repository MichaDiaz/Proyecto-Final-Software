// Reglas de negocio del dominio (las mismas del proyecto ASP.NET).
// Si el backend ya devuelve estos valores calculados, estas funciones solo se usan en el mock.

// Promedio ponderado de lo ya calificado: suma(nota*peso) / suma(peso de lo calificado).
export function promedioPonderado(items) {
  const calificados = items.filter((i) => i.nota !== null && i.nota !== undefined)
  const pesos = calificados.reduce((s, i) => s + i.peso, 0)
  if (pesos === 0) return null
  const total = calificados.reduce((s, i) => s + i.nota * i.peso, 0)
  return Math.round((total / pesos) * 10) / 10
}

export function porcentajeAsistencia(registros) {
  if (registros.length === 0) return null
  const presentes = registros.filter((r) => r.presente).length
  return Math.round((presentes / registros.length) * 100)
}

// Riesgo: alto si prom < 70 o asistencia < 75; moderado si prom < 80 o asistencia < 85.
export function nivelRiesgo(promedio, asistencia) {
  if (promedio === null && asistencia === null) return 'sin-datos'
  if ((promedio !== null && promedio < 70) || (asistencia !== null && asistencia < 75)) return 'alto'
  if ((promedio !== null && promedio < 80) || (asistencia !== null && asistencia < 85)) return 'moderado'
  return 'bajo'
}
