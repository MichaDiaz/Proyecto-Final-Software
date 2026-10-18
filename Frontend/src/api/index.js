// ÚNICO punto de entrada a los datos. Las pantallas importan { api } y nunca saben
// si los datos vienen del mock o del backend real. Para cambiar: VITE_USE_MOCK en .env.
import { USE_MOCK } from '../config.js'
import { mockApi } from './mock/services.js'
import { httpApi } from './http.js'

export const api = USE_MOCK ? mockApi : httpApi
