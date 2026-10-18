import { useCallback, useEffect, useRef, useState } from 'react'

// Carga datos de la API y expone { datos, cargando, error, recargar }.
// Ejemplo: const { datos, cargando } = useAsync(() => api.cursos.listar(), [])
export default function useAsync(funcion, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null })
  const ultima = useRef(0)

  const cargar = useCallback(() => {
    const id = ++ultima.current
    setEstado((e) => ({ ...e, cargando: true, error: null }))
    funcion()
      .then((datos) => id === ultima.current && setEstado({ datos, cargando: false, error: null }))
      .catch((err) => id === ultima.current && setEstado({ datos: null, cargando: false, error: err.message }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias)

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => () => { ultima.current = -1 }, [])

  return { ...estado, recargar: cargar }
}
