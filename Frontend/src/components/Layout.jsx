import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

// Estructura común de todas las páginas. <Outlet /> es el "hueco" donde
// React Router pone la página que corresponde a la dirección actual.
export default function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
