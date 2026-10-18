import { createContext, useCallback, useContext, useRef, useState } from 'react'

// Avisos breves ("Guardado", "Error...") visibles desde cualquier pantalla: const avisar = useAviso()
const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const contador = useRef(0)

  const avisar = useCallback((mensaje, tipo = 'ok') => {
    const id = ++contador.current
    setAvisos((a) => [...a, { id, mensaje, tipo }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso aviso-${a.tipo}`}>
            <i className={`bi ${a.tipo === 'error' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'}`} /> {a.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useAviso = () => useContext(ToastContext)
