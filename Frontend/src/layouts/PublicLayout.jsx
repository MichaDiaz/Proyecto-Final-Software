import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// Estructura de las páginas públicas. <Outlet /> es el hueco donde Router pone la página.
export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="publico">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
