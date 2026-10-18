import { useState } from 'react'
import { api } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAviso } from '../context/ToastContext.jsx'
import { Encabezado } from '../components/ui.jsx'

export default function Perfil() {
  const { usuario, setUsuario } = useAuth()
  const avisar = useAviso()
  const [nombre, setNombre] = useState(usuario.nombre)
  const [claves, setClaves] = useState({ actual: '', nueva: '', repetir: '' })
  const [error, setError] = useState(null)

  async function guardarNombre(e) {
    e.preventDefault()
    try {
      setUsuario(await api.perfil.actualizar({ nombre }))
      avisar('Perfil actualizado.')
    } catch (err) { avisar(err.message, 'error') }
  }

  async function cambiarClave(e) {
    e.preventDefault()
    setError(null)
    if (claves.nueva !== claves.repetir) return setError('Las contraseñas nuevas no coinciden.')
    try {
      await api.perfil.cambiarClave({ actual: claves.actual, nueva: claves.nueva })
      setClaves({ actual: '', nueva: '', repetir: '' })
      avisar('Contraseña cambiada.')
    } catch (err) { setError(err.message) }
  }

  return (
    <>
      <Encabezado titulo="Mi perfil" subtitulo={usuario.correo} />
      <div className="dos-col">
        <form className="form" onSubmit={guardarNombre}>
          <h2>Datos personales</h2>
          <div className="campo">
            <label htmlFor="p-nombre">Nombre</label>
            <input id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <button className="btn btn-primario" type="submit">Guardar</button>
        </form>

        <form className="form" onSubmit={cambiarClave}>
          <h2>Cambiar contraseña</h2>
          <div className="campo">
            <label htmlFor="p-actual">Contraseña actual</label>
            <input id="p-actual" type="password" autoComplete="current-password" value={claves.actual} onChange={(e) => setClaves({ ...claves, actual: e.target.value })} required />
          </div>
          <div className="campo">
            <label htmlFor="p-nueva">Nueva contraseña</label>
            <input id="p-nueva" type="password" autoComplete="new-password" minLength={8} value={claves.nueva} onChange={(e) => setClaves({ ...claves, nueva: e.target.value })} required />
            <small className="ayuda">Mínimo 8 caracteres.</small>
          </div>
          <div className="campo">
            <label htmlFor="p-rep">Repetir nueva contraseña</label>
            <input id="p-rep" type="password" autoComplete="new-password" value={claves.repetir} onChange={(e) => setClaves({ ...claves, repetir: e.target.value })} required />
          </div>
          {error && <p className="msg msg-error" role="alert">{error}</p>}
          <button className="btn btn-primario" type="submit">Cambiar contraseña</button>
        </form>
      </div>
    </>
  )
}
