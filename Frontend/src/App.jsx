import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import Inicio from './pages/Inicio.jsx'
import Ingresar from './pages/Ingresar.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import Resumen from './pages/Resumen.jsx'
import Cursos from './pages/Cursos.jsx'
import CursoDetalle from './pages/CursoDetalle.jsx'
import Usuarios from './pages/admin/Usuarios.jsx'
import Perfil from './pages/Perfil.jsx'

// RUTAS. Cada <Route> dice "cuando la dirección sea X, muestra la página Y".
//  - Públicas: /, /ingresar
//  - Privadas (con sesión): todo lo que cuelga de /app. /app/usuarios solo para administración.
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Inicio />} />
        <Route path="ingresar" element={<Ingresar />} />
      </Route>

      <Route path="app" element={<RutaProtegida />}>
        <Route element={<AppLayout />}>
          <Route index element={<Resumen />} />
          <Route path="cursos" element={<Cursos />} />
          <Route path="cursos/:id" element={<CursoDetalle />} />
          <Route path="perfil" element={<Perfil />} />
          <Route element={<RutaProtegida roles={['admin']} />}>
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PublicLayout />}>
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
