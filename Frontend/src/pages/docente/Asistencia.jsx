import { useEffect, useState } from 'react'
import { api } from '../../api/index.js'
import { useAviso } from '../../context/ToastContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { Badge, Cargando, ErrorCaja, Vacio } from '../../components/ui.jsx'
import { hoyISO } from '../../utils/formato.js'

// Pasar lista de una sesión: elige la fecha, marca ausentes y guarda.
export default function Asistencia({ cursoId, alGuardar }) {
  const avisar = useAviso()
  const [fecha, setFecha] = useState(hoyISO())
  const { datos, cargando, error, recargar } = useAsync(() => api.asistencia.obtener(cursoId, fecha), [cursoId, fecha])
  const [registros, setRegistros] = useState([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { if (datos) setRegistros(datos.registros) }, [datos])

  const presentes = registros.filter((r) => r.presente).length
  const marcar = (id, presente) => setRegistros((rs) => rs.map((r) => (r.estudianteId === id ? { ...r, presente } : r)))
  const marcarTodos = (presente) => setRegistros((rs) => rs.map((r) => ({ ...r, presente })))

  async function guardar() {
    setGuardando(true)
    try {
      await api.asistencia.guardar(cursoId, fecha, registros.map(({ estudianteId, presente }) => ({ estudianteId, presente })))
      avisar('Asistencia guardada.')
      recargar()
      alGuardar?.()
    } catch (err) { avisar(err.message, 'error') } finally { setGuardando(false) }
  }

  return (
    <section className="tarjeta">
      <div className="fila-form">
        <div className="campo campo-en-linea">
          <label htmlFor="a-fecha">Fecha de la sesión</label>
          <input id="a-fecha" type="date" value={fecha} max={hoyISO()} onChange={(e) => e.target.value && setFecha(e.target.value)} />
        </div>
        {datos && (datos.registrada
          ? <Badge tono="bajo" icono="bi-check-circle-fill">Lista ya registrada</Badge>
          : <Badge tono="moderado" icono="bi-clock">Sin registrar</Badge>)}
      </div>

      {cargando && !datos && <Cargando />}
      {error && <ErrorCaja mensaje={error} alReintentar={recargar} />}
      {datos && registros.length === 0 && <Vacio icono="bi-person-x" titulo="Sin estudiantes" texto="No hay estudiantes matriculados." />}

      {registros.length > 0 && (
        <>
          <div className="acciones-linea">
            <button type="button" className="btn btn-claro btn-chico" onClick={() => marcarTodos(true)}>Todos presentes</button>
            <button type="button" className="btn btn-claro btn-chico" onClick={() => marcarTodos(false)}>Todos ausentes</button>
            <span className="suave">{presentes} de {registros.length} presentes</span>
          </div>
          <ul className="lista">
            {registros.map((r) => (
              <li key={r.estudianteId}>
                <strong>{r.nombre}</strong>
                <label className="interruptor">
                  <input type="checkbox" checked={r.presente} onChange={(e) => marcar(r.estudianteId, e.target.checked)} />
                  <span>{r.presente ? 'Presente' : 'Ausente'}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="acciones">
            <button type="button" className="btn btn-primario" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar lista'}</button>
          </div>
        </>
      )}
    </section>
  )
}
