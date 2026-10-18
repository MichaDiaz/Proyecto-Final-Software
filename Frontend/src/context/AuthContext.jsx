import { createContext, useContext, useState } from 'react'
import { usuarios } from '../data/usuarios.js'

// CONCEPTO 7: CONTEXTO. Sirve para compartir un dato (quién inició sesión)
// con TODOS los componentes sin pasarlo como prop por cada nivel.
const AuthContext = createContext(null)
const CLAVE = 'homeclass-sesion'

function leerSesion() {
  try {
    const texto = sessionStorage.getItem(CLAVE)
    return texto ? JSON.parse(texto) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesion)

  function ingresar(correo, clave) {
    const encontrado = usuarios.find(
      (u) => u.correo === correo.trim().toLowerCase() && u.clave === clave,
    )
    if (!encontrado) return { ok: false, error: 'Correo o contraseña incorrectos.' }

    const sesion = { correo: encontrado.correo, nombre: encontrado.nombre, rol: encontrado.rol }
    setUsuario(sesion)
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
    } catch {
      /* sin almacenamiento: la sesión dura hasta recargar */
    }
    return { ok: true }
  }

  function salir() {
    setUsuario(null)
    try {
      sessionStorage.removeItem(CLAVE)
    } catch {
      /* nada */
    }
  }

  return <AuthContext.Provider value={{ usuario, ingresar, salir }}>{children}</AuthContext.Provider>
}

// Hook para leer el contexto desde cualquier componente: const { usuario } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
