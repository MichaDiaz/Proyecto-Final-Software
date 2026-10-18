import useTheme from '../hooks/useTheme.js'

export default function Navbar() {
  const { tema, alternar } = useTheme()

  return (
    <header className="nav">
      <a className="brand" href="/" aria-label="HomeClass, inicio">
        <span className="brand-mark"><i className="bi bi-house-heart-fill" /></span>
        <span>
          <strong className="brand-name">HomeClass</strong>
          <small>Entorno Académico</small>
        </span>
      </a>

      <div className="nav-actions">
        {/* onClick recibe una función: React la llama cuando haces clic */}
        <button
          type="button"
          className="icon-btn"
          onClick={alternar}
          aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {/* Renderizado condicional: según el estado, mostramos un icono u otro */}
          <i className={tema === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars'} />
        </button>
        {/* En el proyecto real este enlace lleva al login de ASP.NET */}
        <a className="btn btn-tiza" href="/Cuenta/Ingresar">Ingresar</a>
      </div>
    </header>
  )
}
