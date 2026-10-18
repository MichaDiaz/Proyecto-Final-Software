import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usuarios } from '../data/usuarios.js'

export default function Ingresar() {
  const { usuario, ingresar } = useAuth()
  const navegar = useNavigate() // permite cambiar de página desde el código
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState(null)

  // Si ya hay sesión, no tiene sentido ver el login: vamos directo al panel.
  if (usuario) return <Navigate to="/panel" replace />

  // Formulario CONTROLADO: el valor de cada campo vive en el estado de React.
  function alEnviar(e) {
    e.preventDefault() // evita que el navegador recargue la página
    const resultado = ingresar(correo, clave)
    if (resultado.ok) navegar('/panel')
    else setError(resultado.error)
  }

  function usarEjemplo(u) {
    setCorreo(u.correo)
    setClave(u.clave)
    setError(null)
  }

  return (
    <section className="login">
      <h1>Ingresar a HomeClass</h1>
      <p className="subtitulo">Entra con tu cuenta para ver tu panel.</p>

      <form className="form" onSubmit={alEnviar}>
        <label className="campo">
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoComplete="username" />
        </label>
        <label className="campo">
          Contraseña
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required autoComplete="current-password" />
        </label>

        <div aria-live="polite">{error && <p className="msg msg-error">{error}</p>}</div>

        <button type="submit" className="btn btn-primario">Ingresar</button>
      </form>

      <div className="ejemplos">
        <p className="demo-etiqueta">Cuentas de ejemplo (clic para rellenar)</p>
        <div className="ejemplos-botones">
          {usuarios.map((u) => (
            <button key={u.rol} type="button" className="tab" onClick={() => usarEjemplo(u)}>
              {u.rol}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
