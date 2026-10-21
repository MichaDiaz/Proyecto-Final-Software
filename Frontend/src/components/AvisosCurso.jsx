import { useState } from 'react'
import { api } from '../api/index.js'
import { useAviso } from '../context/ToastContext.jsx'
import useAsync from '../hooks/useAsync.js'
import { Cargando, ErrorCaja, Vacio } from './ui.jsx'
import { fechaHora } from '../utils/formato.js'

export default function AvisosCurso({ cursoId, puedePublicar = false }) {
  const { datos, cargando, error, recargar } = useAsync(() => api.avisos.listar(cursoId), [cursoId])
  const avisar = useAviso()
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState(null)

  async function publicar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrorFormulario(null)
    try {
      await api.avisos.publicar(cursoId, { titulo, mensaje })
      setTitulo('')
      setMensaje('')
      avisar('Aviso publicado.')
      recargar()
    } catch (err) { setErrorFormulario(err.message) } finally { setEnviando(false) }
  }

  return (
    <section className="tarjeta avisos-curso">
      <header className="seccion-cabecera">
        <div><h2>Avisos del curso</h2><p className="suave">Actualizaciones para quienes participan en esta clase.</p></div>
      </header>
      {puedePublicar && (
        <form className="aviso-form" onSubmit={publicar}>
          <div className="campo"><label htmlFor={`aviso-titulo-${cursoId}`}>Título</label><input id={`aviso-titulo-${cursoId}`} maxLength={120} value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></div>
          <div className="campo"><label htmlFor={`aviso-mensaje-${cursoId}`}>Mensaje</label><textarea id={`aviso-mensaje-${cursoId}`} maxLength={2000} rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} required /></div>
          {errorFormulario && <p className="msg msg-error" role="alert">{errorFormulario}</p>}
          <button className="btn btn-primario" type="submit" disabled={enviando}>{enviando ? 'Publicando…' : <><i className="bi bi-megaphone" /> Publicar aviso</>}</button>
        </form>
      )}
      {cargando && <Cargando />}
      {error && <ErrorCaja mensaje={error} alReintentar={recargar} />}
      {datos?.length === 0 && <Vacio icono="bi-megaphone" titulo="Sin avisos" texto="Los avisos nuevos aparecerán aquí." />}
      {datos?.length > 0 && (
        <ul className="avisos-lista">
          {datos.map((aviso) => (
            <li key={aviso.id}>
              <div className="aviso-meta"><strong>{aviso.autor}</strong><time dateTime={aviso.fecha}>{fechaHora(aviso.fecha)}</time></div>
              <h3>{aviso.titulo}</h3>
              <p>{aviso.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}