import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vite sirve la página mientras desarrollas (npm run dev) y la empaqueta (npm run build).
// En .env define VITE_PROXY=http://localhost:5000 para reenviar /api al backend durante desarrollo.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: mode === 'production' ? '/Proyecto-Final-Software/' : '/',
    plugins: [react()],
    server: env.VITE_PROXY
      ? { proxy: { '/api': { target: env.VITE_PROXY, changeOrigin: true } } }
      : {},
  }
})
