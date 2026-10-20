# HomeClass API

Backend ASP.NET Web API para la app del frontend `Frontend`.

## Qué contiene

- Autenticación con JWT-like token en memoria.
- Login con `POST /api/auth/login`.
- Sesión con `GET /api/auth/sesion`.
- Dashboard compatible con la interfaz del frontend.
- Endpoints básicos de usuarios y cursos para cargar la aplicación.

## Requisitos

- Visual Studio 2022 con ASP.NET y Web Developer tools.
- .NET Framework 4.8.

## Ejecutar

1. Abrir la solución en Visual Studio.
2. Seleccionar `HomeClassApi` como proyecto de inicio.
3. Presionar `F5` para iniciar el servidor.
4. El backend quedará en `http://localhost:5000`.

## Credenciales demo

- Admin: `admin@homeclass.com` / `admin123`
- Docente: `docente@homeclass.com` / `docente123`
- Estudiante: `estudiante@homeclass.com` / `estudiante123`

## Nota

Este backend se diseñó para ser compatible con el frontend actual y sirve como base de acceso, sesión y menú principal del sistema.
