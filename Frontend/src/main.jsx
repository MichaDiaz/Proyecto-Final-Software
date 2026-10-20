import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles.css'

function borrarDatosDeDemostracion() {
  try { localStorage.removeItem('homeclass-db-v1') } catch { /* almacenamiento no disponible */ }
  try {
    const token = sessionStorage.getItem('homeclass-token')
    if (token && /^\d+$/.test(token)) sessionStorage.removeItem('homeclass-token')
  } catch { /* almacenamiento no disponible */ }
  try { globalThis.indexedDB?.deleteDatabase('homeclass-archivos') } catch { /* IndexedDB no disponible */ }
}

borrarDatosDeDemostracion()

// PUNTO DE ENTRADA: React se conecta con div#root.
// BrowserRouter = navegación por direcciones · AuthProvider = sesión · ToastProvider = avisos.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
