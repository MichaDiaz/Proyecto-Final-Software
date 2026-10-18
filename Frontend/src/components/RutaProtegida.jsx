import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Si no hay sesión, manda al login. Si hay, muestra el contenido (children).
export default function RutaProtegida({ children }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/ingresar" replace />
  return children
}
