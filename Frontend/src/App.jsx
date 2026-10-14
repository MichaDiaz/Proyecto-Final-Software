import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import RolesTabs from './components/RolesTabs.jsx'
import Features from './components/Features.jsx'
import Footer from './components/Footer.jsx'

// CONCEPTO 1: un componente es una función que devuelve JSX (HTML dentro de JavaScript).
// App no tiene lógica: solo ordena los componentes de la página, como piezas de LEGO.
export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <RolesTabs />
        <Features />
      </main>
      <Footer />
    </>
  )
}