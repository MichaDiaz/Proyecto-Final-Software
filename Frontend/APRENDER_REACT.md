# Aprende React con el Home de HomeClass

## 1. Ponerlo a andar
1. Instala Node.js LTS desde https://nodejs.org
2. En esta carpeta: `npm install`
3. `npm run dev` y abre la dirección que aparece (http://localhost:5173)
4. Edita cualquier texto en `src/` y guarda: la página cambia sola.

## 2. Mapa de archivos (léelos en este orden)
| Archivo | Qué aprendes |
|---|---|
| `index.html` | Solo tiene `<div id="root">`; React dibuja ahí. |
| `src/main.jsx` | Punto de entrada: conecta React con el HTML. |
| `src/App.jsx` | Un componente que junta otros componentes. |
| `src/components/Footer.jsx` | Componente más simple: una función que devuelve JSX. |
| `src/data/roles.js` | Datos separados de la vista. |
| `src/components/Features.jsx` | Listas con `.map()` y `key`; props. |
| `src/components/RolesTabs.jsx` | Estado con `useState`; renderizado según el estado. |
| `src/components/EntregaDemo.jsx` | Eventos, formularios, validación, `useId`. |
| `src/hooks/useTheme.js` | Tu propio hook; `useEffect`; localStorage. |

## 3. Los 6 conceptos (todos están comentados en el código)
1. **Componente**: función con nombre en Mayúscula que devuelve JSX.
2. **Listas**: `array.map(x => <Item key={x.id} />)`. La `key` debe ser única y estable.
3. **Estado**: `const [valor, setValor] = useState(inicial)`. Al llamar `setValor`, React vuelve a dibujar. Nunca modifiques el valor directamente.
4. **Eventos**: `onClick={fn}`, `onChange={fn}`. Pasa la función, no la ejecutes (`onClick={fn}`, no `onClick={fn()}`).
5. **Hook propio**: función `useAlgo` que reutiliza lógica con estado.
6. **Props**: datos que un componente padre le pasa al hijo (`<Balance titulo="..." />`). Son de solo lectura.

Regla de oro: **la pantalla es una función del estado**. No cambias el HTML a mano; cambias el estado y React actualiza la pantalla.

## 4. Ejercicios (de fácil a difícil)
1. Cambia el título del Hero y el texto del botón.
2. Agrega una cuarta funcionalidad en `roles.js` (`funcionalidades`). Aparece sola: ¿por qué?
3. Agrega un cuarto rol, "Padre de familia", y mira que aparezca como pestaña.
4. En `EntregaDemo`, agrega `png` a las extensiones permitidas y baja el límite a 5 MB.
5. Agrega un campo de comentario (`<textarea>` controlado con `useState`) y muéstralo tras entregar.
6. Haz que el botón "Entregar" muestre "Enviando..." 1.5 s usando `setTimeout`.
7. Crea `components/ContadorCursos.jsx` que reciba `cursos` por props y muestre "N cursos".
8. Haz que las pestañas se cambien con las flechas ← → del teclado (`onKeyDown`).
9. Crea un hook `useContador(inicial)` que devuelva `{valor, sumar, restar}`.
10. Guarda la última pestaña elegida en localStorage, copiando el patrón de `useTheme`.

## 5. Siguientes pasos
- **React Router** (`npm i react-router-dom`): varias páginas (Login, Panel).
- **fetch + useEffect**: traer datos reales:
  ```jsx
  useEffect(() => {
    fetch('/api/cursos').then(r => r.json()).then(setCursos)
  }, [])
  ```
- **Conectar con el backend .NET**: expón endpoints `/api/...` en ASP.NET y activa CORS, o configura `server.proxy` en `vite.config.js`.
- **Subida real de archivos**:
  ```jsx
  const datos = new FormData()
  datos.append('archivo', archivo)
  fetch('/api/entregas', { method: 'POST', body: datos })
  ```
- Tutorial oficial: https://es.react.dev/learn

## 6. Errores típicos
- Olvidar `key` en listas → advertencia en consola.
- Usar `class` en vez de `className`, `for` en vez de `htmlFor`.
- Devolver dos elementos sin envoltorio → usa `<> ... </>`.
- Cambiar el estado directamente (`lista.push(x)`) → usa `setLista([...lista, x])`.
- Componentes con minúscula (`<hero />`) → React cree que es una etiqueta HTML.

## 7. Publicar
`npm run build` genera la carpeta `dist/`, lista para subir a cualquier hosting estático.
