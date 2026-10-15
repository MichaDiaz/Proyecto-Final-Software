export default function Footer() {
  // Las expresiones de JavaScript van entre llaves dentro del JSX
  const anio = new Date().getFullYear()
  return (
    <footer className="footer">
      <p>© {anio} HomeClass, Entorno Académico</p>
    </footer>
  )
}
