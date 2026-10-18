// Configuración del frontend. Los valores salen del archivo .env (ver .env.example).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false' // por defecto: datos de ejemplo
export const API_URL = import.meta.env.VITE_API_URL || '/api'

// Reglas de archivos (el backend debe aplicar las mismas: nunca confíes solo en el frontend).
export const MAX_MB_GLOBAL = 25
export const EXTENSIONES_PERMITIDAS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'txt', 'md', 'csv',
  'zip', 'rar', '7z', 'png', 'jpg', 'jpeg', 'sql', 'c', 'cs', 'js', 'py', 'java',
]
