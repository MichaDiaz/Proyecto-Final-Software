import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vite sirve la página mientras desarrollas (npm run dev) y la empaqueta (npm run build).
// VITE_PROXY puede cambiar el backend; por defecto coincide con el puerto de Visual Studio.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_PROXY || 'http://localhost:5000'
  return {
    base: mode === 'production' ? '/Proyecto-Final-Software/' : '/',
    plugins: [react()],
    server: { proxy: { '/api': { target: backendUrl, changeOrigin: true } } },
  }
})
