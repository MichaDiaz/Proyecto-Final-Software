import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vite sirve la página mientras desarrollas (npm run dev) y la empaqueta (npm run build).
// Cuando exista el backend: en .env pon VITE_USE_MOCK=false y VITE_PROXY=http://localhost:5000
// y todas las llamadas a /api se reenvían al backend (sin problemas de CORS en desarrollo).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: env.VITE_PROXY
      ? { proxy: { '/api': { target: env.VITE_PROXY, changeOrigin: true } } }
      : {},
  }
})
