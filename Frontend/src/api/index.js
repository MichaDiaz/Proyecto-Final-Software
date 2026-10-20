// Único punto de entrada a los datos; toda la información persistente viene del backend.
import { httpApi } from './http.js'

export const api = httpApi
