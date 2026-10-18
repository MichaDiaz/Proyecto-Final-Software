import { useAuth } from '../context/AuthContext.jsx'
import CursoAdmin from './admin/CursoAdmin.jsx'
import CursoDocente from './docente/CursoDocente.jsx'
import CursoEstudiante from './estudiante/CursoEstudiante.jsx'

// /app/cursos/:id muestra una vista distinta según el rol.
export default function CursoDetalle() {
  const { usuario } = useAuth()
  if (usuario.rol === 'admin') return <CursoAdmin />
  if (usuario.rol === 'docente') return <CursoDocente />
  return <CursoEstudiante />
}
