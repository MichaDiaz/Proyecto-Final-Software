import Hero from '../components/Hero.jsx'
import RolesTabs from '../components/RolesTabs.jsx'
import Features from '../components/Features.jsx'

// La página de inicio es solo la unión de las secciones que ya tenías.
export default function Inicio() {
  return (
    <>
      <Hero />
      <RolesTabs />
      <Features />
    </>
  )
}
