import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap-icons/font/bootstrap-icons.css' // iconos (<i className="bi bi-...">)
import './styles.css'

// PUNTO DE ENTRADA: aquí React "se conecta" con el div#root del index.html
// y dibuja el componente App. Todo lo demás cuelga de App.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)