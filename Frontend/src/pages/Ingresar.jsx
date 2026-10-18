import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { USE_MOCK } from '../config.js'

const EJEMPLOS = [
  { rol: 'Administración', correo: 'admin@homeclass.edu', clave: 'Admin#2026' },
  { rol: 'Docente', correo: 'docente@homeclass.edu', clave: 'Docente#2026' },
  { rol: 'Estudiante', correo: 'estudiante@homeclass.edu', clave: 'Estudiante#2026' },
]

export default function Ingresar() {
  const { usuario, ingresar } = useAuth()
  const navegar = useNavigate()
  const { state } = useLocation()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={state?.desde ?? '/app'} replace />

  async function alEnviar(e) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await ingresar(correo, clave)
      navegar(state?.desde ?? '/app', { replace: true })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <section className="login">
      <h1>Ingresar a HomeClass</h1>
      <p className="suave">Entra con tu cuenta para ver tu panel.</p>

      <form className="form" onSubmit={alEnviar} noValidate={false}>
        <div className="campo">
          <label htmlFor="correo">Correo</label>
          <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoComplete="username" />
        </div>
        <div className="campo">
          <label htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} required autoComplete="current-password" />
        </div>
        <div aria-live="polite">{error && <p className="msg msg-error">{error}</p>}</div>
        <button type="submit" className="btn btn-primario" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>

      {USE_MOCK && (
        <div className="ejemplos">
          <p className="demo-etiqueta">Cuentas de ejemplo (clic para rellenar)</p>
          <div className="ejemplos-botones">
            {EJEMPLOS.map((u) => (
              <button key={u.correo} type="button" className="tab" onClick={() => { setCorreo(u.correo); setClave(u.clave); setError(null) }}>
                {u.rol}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
