import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite es la herramienta que arma el proyecto: sirve la página mientras desarrollas
// (npm run dev) y la empaqueta para publicar (npm run build).
export default defineConfig({
  plugins: [react()],
})
