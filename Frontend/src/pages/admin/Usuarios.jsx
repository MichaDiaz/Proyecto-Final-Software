import { useMemo, useState } from 'react'
import { api } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAviso } from '../../context/ToastContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { Badge, Cargando, Confirmar, Encabezado, ErrorCaja, Modal, Vacio } from '../../components/ui.jsx'

const ROLES = { admin: 'Administración', docente: 'Docente', estudiante: 'Estudiante' }

export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const avisar = useAviso()
  const { datos, cargando, error, recargar } = useAsync(() => api.usuarios.listar(), [])
  const [buscar, setBuscar] = useState('')
  const [rol, setRol] = useState('todos')
  const [editando, setEditando] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    return (datos ?? []).filter((u) => (rol === 'todos' || u.rol === rol) && (!q || u.nombre.toLowerCase().includes(q) || u.correo.includes(q)))
  }, [datos, buscar, rol])

  async function alternarActivo(u) {
    try {
      await api.usuarios.actualizar(u.id, { ...u, activo: !u.activo })
      avisar(u.activo ? 'Cuenta desactivada.' : 'Cuenta activada.')
      recargar()
    } catch (err) { avisar(err.message, 'error') }
  }

  async function eliminar() {
    setOcupado(true)
    try {
      await api.usuarios.eliminar(aEliminar.id)
      avisar('Usuario eliminado.')
      setAEliminar(null)
      recargar()
    } catch (err) { avisar(err.message, 'error'); setAEliminar(null) } finally { setOcupado(false) }
  }

  return (
    <>
      <Encabezado titulo="Usuarios" subtitulo="Cuentas de administración, docentes y estudiantes.">
        <button type="button" className="btn btn-primario" onClick={() => setEditando({})}><i className="bi bi-person-plus" /> Nuevo usuario</button>
      </Encabezado>

      <div className="filtros">
        <input type="search" placeholder="Buscar por nombre o correo…" aria-label="Buscar usuarios" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <select aria-label="Filtrar por rol" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="todos">Todos los roles</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {cargando && <Cargando />}
      {error && <ErrorCaja mensaje={error} alReintentar={recargar} />}
      {datos && filtrados.length === 0 && <Vacio icono="bi-search" titulo="Sin resultados" texto="Prueba con otra búsqueda." />}

      {filtrados.length > 0 && (
        <div className="tabla-caja">
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id}>
                  <td data-etiqueta="Nombre"><strong>{u.nombre}</strong>{u.id === yo.id && <small className="suave"> (tú)</small>}</td>
                  <td data-etiqueta="Correo">{u.correo}</td>
                  <td data-etiqueta="Rol">{ROLES[u.rol]}</td>
                  <td data-etiqueta="Estado">{u.activo ? <Badge tono="bajo" icono="bi-check-circle-fill">Activa</Badge> : <Badge tono="neutro" icono="bi-slash-circle">Inactiva</Badge>}</td>
                  <td className="celda-acciones">
                    <button type="button" className="btn btn-claro btn-chico" onClick={() => setEditando(u)}>Editar</button>
                    {u.id !== yo.id && (
                      <>
                        <button type="button" className="btn btn-claro btn-chico" onClick={() => alternarActivo(u)}>{u.activo ? 'Desactivar' : 'Activar'}</button>
                        <button type="button" className="btn btn-peligro-claro btn-chico" onClick={() => setAEliminar(u)} aria-label={`Eliminar a ${u.nombre}`}><i className="bi bi-trash" /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormularioUsuario usuario={editando} yo={yo} alCerrar={() => setEditando(null)} alGuardar={() => { setEditando(null); recargar() }} />
      <Confirmar
        abierto={!!aEliminar}
        titulo="Eliminar usuario"
        texto={aEliminar && `Se eliminará a ${aEliminar.nombre} junto con sus notas, asistencia y entregas.`}
        alConfirmar={eliminar}
        alCancelar={() => setAEliminar(null)}
        ocupado={ocupado}
      />
    </>
  )
}

function FormularioUsuario({ usuario, yo, alCerrar, alGuardar }) {
  const avisar = useAviso()
  const [form, setForm] = useState({})
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [ultimo, setUltimo] = useState(null)
  const nuevo = usuario && !usuario.id

  if (usuario !== ultimo) {
    setUltimo(usuario)
    if (usuario) {
      setForm({ nombre: usuario.nombre ?? '', correo: usuario.correo ?? '', rol: usuario.rol ?? 'estudiante', clave: '', activo: usuario.activo ?? true })
      setError(null)
    }
  }
  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      if (nuevo) await api.usuarios.crear(form)
      else await api.usuarios.actualizar(usuario.id, form)
      avisar(nuevo ? 'Usuario creado.' : 'Usuario actualizado.')
      alGuardar()
    } catch (err) { setError(err.message) } finally { setEnviando(false) }
  }

  return (
    <Modal abierto={usuario !== null} titulo={nuevo ? 'Nuevo usuario' : 'Editar usuario'} alCerrar={alCerrar}>
      <form onSubmit={enviar} className="form-modal">
        <div className="campo"><label htmlFor="u-nombre">Nombre</label><input id="u-nombre" value={form.nombre ?? ''} onChange={cambiar('nombre')} required /></div>
        <div className="campo"><label htmlFor="u-correo">Correo</label><input id="u-correo" type="email" value={form.correo ?? ''} onChange={cambiar('correo')} required /></div>
        <div className="campo">
          <label htmlFor="u-rol">Rol</label>
          <select id="u-rol" value={form.rol ?? 'estudiante'} onChange={cambiar('rol')} disabled={usuario?.id === yo.id}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {nuevo && (
          <div className="campo">
            <label htmlFor="u-clave">Contraseña inicial</label>
            <input id="u-clave" type="password" minLength={8} autoComplete="new-password" value={form.clave ?? ''} onChange={cambiar('clave')} required />
            <small className="ayuda">Mínimo 8 caracteres.</small>
          </div>
        )}
        {error && <p className="msg msg-error" role="alert">{error}</p>}
        <div className="acciones">
          <button type="button" className="btn btn-claro" onClick={alCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  )
}
