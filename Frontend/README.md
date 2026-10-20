# HomeClass · Entorno Académico (Frontend)

Aplicación web en **React + Vite** para organizar cursos y dar seguimiento académico a instituciones educativas.
Los datos persistentes se consultan y modifican exclusivamente mediante la API HTTP documentada en `docs/API.md`.
El backend y la base de datos aún deben implementarse; mientras tanto, el inicio de sesión y las funciones que
requieren datos mostrarán un error de conexión y no guardarán registros de ejemplo en el navegador.

## Cómo correrlo

Requisito: Node.js 18 o superior (https://nodejs.org).

```bash
cd Frontend
npm install
npm run dev        # abre http://localhost:5173
npm run build      # genera la carpeta dist/ para publicar
```

## Qué puede hacer cada rol

| Rol | Funciones |
|---|---|
| **Administración** | Resumen institucional (balance, riesgo, promedios). Usuarios: crear, editar, activar/desactivar, eliminar. Cursos: crear, editar, eliminar, asignar docente, matricular y quitar estudiantes. |
| **Docente** | Resumen con alertas de estudiantes en riesgo, próximas evaluaciones y entregas por revisar. Por curso: **calificaciones** (libro con promedio ponderado en vivo), **asistencia** por sesión, **evaluaciones** (tarea, proyecto, examen: peso, fecha, instrucciones y si piden archivo con tipos y tamaño permitidos), **entregas** (descarga y califica), **materiales** (sube archivos). |
| **Estudiante** | Resumen con su promedio, asistencia y entregas pendientes. Por curso: sus notas, promedio del grupo, **sube / reemplaza / retira su entrega** con validación de tipo y tamaño, descarga materiales. |

Reglas del dominio (las mismas del proyecto ASP.NET):
- Promedio ponderado de lo ya calificado: `Σ(nota × peso) / Σ(peso calificado)`.
- Riesgo **alto**: promedio < 70 o asistencia < 75. **Moderado**: promedio < 80 o asistencia < 85.
- La suma de pesos de un curso no puede pasar de 100%.
- Una entrega calificada ya no se puede cambiar ni retirar; las entregas tardías solo se aceptan si la evaluación lo permite.

## Estructura

```
Frontend/
├── index.html
├── package.json · vite.config.js · .env.example
├── docs/API.md            ← contrato para el backend y la base de datos
└── src/
    ├── main.jsx · App.jsx          arranque y rutas
    ├── config.js                   configuración de API y reglas de archivos
    ├── api/
    │   ├── index.js                ÚNICO punto de acceso a datos: import { api } from '../api'
    │   ├── http.js                 implementación REAL (fetch al backend)
    │   ├── sesion.js               token de sesión
    ├── context/                    AuthContext (sesión) y ToastContext (avisos)
    ├── hooks/                      useAsync (cargar datos), useTheme (claro/oscuro)
    ├── utils/                      calculos (reglas), formato, archivos (validación)
    ├── layouts/                    PublicLayout y AppLayout (menú lateral por rol)
    ├── components/                 ui.jsx (Modal, Tabs, Badge, BarList…), SelectorArchivo…
    └── pages/
        ├── Inicio · Ingresar · Resumen · Cursos · CursoDetalle · Perfil
        ├── admin/      Usuarios, CursoAdmin
        ├── docente/    CursoDocente, Libro, Asistencia, Evaluaciones, Entregas, Materiales
        └── estudiante/ CursoEstudiante
```

## Cómo se conecta el backend después

1. Copia `.env.example` como `.env` y configura:
   ```
   VITE_API_URL=/api
   VITE_PROXY=http://localhost:5000      # dirección del backend en desarrollo
   ```
2. Implementa en el backend los endpoints de **`docs/API.md`** (mismas rutas y mismas respuestas).
3. `src/api/http.js` ya consume esas rutas. Ninguna pantalla necesita almacenar los registros localmente.

Reglas que el backend debe aplicar sí o sí (el frontend solo las valida para dar mensajes rápidos):
autenticación y permisos por rol y por curso, validación de tipo/tamaño de archivo, que los archivos se
guarden **fuera de la carpeta pública** con nombre aleatorio, y descargas solo a quien corresponda.

## Seguridad

- El login requiere un backend que devuelva un token; el frontend lo envía en `Authorization: Bearer`.
- Los textos se muestran con React, que escapa el HTML por defecto (no usar `dangerouslySetInnerHTML`).
