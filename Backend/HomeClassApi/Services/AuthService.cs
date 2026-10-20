using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using HomeClassApi.Models;

namespace HomeClassApi.Services
{
    public static class AuthService
    {
        private static readonly object Lock = new object();

        private static readonly List<UsuarioSeed> Usuarios = new List<UsuarioSeed>
        {
            new UsuarioSeed { Id = 1, Nombre = "Administrador", Correo = "admin@homeclass.com", ClaveHash = Hash("admin123"), Rol = "admin", Activo = true },
            new UsuarioSeed { Id = 2, Nombre = "Docente Uno", Correo = "docente@homeclass.com", ClaveHash = Hash("docente123"), Rol = "docente", Activo = true },
            new UsuarioSeed { Id = 3, Nombre = "Estudiante Uno", Correo = "estudiante@homeclass.com", ClaveHash = Hash("estudiante123"), Rol = "estudiante", Activo = true }
        };

        private static readonly List<CursoSeed> Cursos = new List<CursoSeed>
        {
            new CursoSeed { Id = 1, Codigo = "CS101", Nombre = "Programación I", Periodo = "2026-1", Descripcion = "Fundamentos de programación.", DocenteId = 2 },
            new CursoSeed { Id = 2, Codigo = "DB201", Nombre = "Bases de Datos", Periodo = "2026-1", Descripcion = "Diseño y consulta de BD.", DocenteId = 2 },
            new CursoSeed { Id = 3, Codigo = "ENG301", Nombre = "Inglés Técnico", Periodo = "2026-1", Descripcion = "Comunicación técnica.", DocenteId = 2 }
        };

        public static UsuarioSeed BuscarPorCorreo(string correo)
        {
            lock (Lock)
            {
                return Usuarios.FirstOrDefault(u => u.Correo.Equals(correo, StringComparison.OrdinalIgnoreCase));
            }
        }

        public static UsuarioRespuesta ValidarLogin(string correo, string clave)
        {
            var usuario = BuscarPorCorreo(correo);
            if (usuario == null || !usuario.Activo)
            {
                return null;
            }

            if (!string.Equals(usuario.ClaveHash, Hash(clave), StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return new UsuarioRespuesta
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Correo = usuario.Correo,
                Rol = usuario.Rol,
                Activo = usuario.Activo
            };
        }

        public static UsuarioRespuesta ObtenerPorId(int id)
        {
            lock (Lock)
            {
                var usuario = Usuarios.FirstOrDefault(u => u.Id == id);
                if (usuario == null) return null;
                return new UsuarioRespuesta
                {
                    Id = usuario.Id,
                    Nombre = usuario.Nombre,
                    Correo = usuario.Correo,
                    Rol = usuario.Rol,
                    Activo = usuario.Activo
                };
            }
        }

        public static List<UsuarioRespuesta> ObtenerUsuarios()
        {
            lock (Lock)
            {
                return Usuarios.Select(u => new UsuarioRespuesta
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Correo = u.Correo,
                    Rol = u.Rol,
                    Activo = u.Activo
                }).ToList();
            }
        }

        public static IEnumerable<object> ObtenerCursos(string rol, int usuarioId)
        {
            var cursos = new List<object>();
            foreach (var curso in Cursos)
            {
                var docente = ObtenerPorId(curso.DocenteId ?? 0);
                if (rol == "admin")
                {
                    cursos.Add(new { id = curso.Id, codigo = curso.Codigo, nombre = curso.Nombre, periodo = curso.Periodo, descripcion = curso.Descripcion, docenteId = curso.DocenteId, docente = docente?.Nombre ?? "Sin docente", estudiantes = 1 });
                }
                else if (rol == "docente")
                {
                    if (curso.DocenteId == usuarioId)
                    {
                        cursos.Add(new { id = curso.Id, codigo = curso.Codigo, nombre = curso.Nombre, periodo = curso.Periodo, descripcion = curso.Descripcion, docenteId = curso.DocenteId, docente = docente?.Nombre ?? "Sin docente", estudiantes = 1 });
                    }
                }
                else if (rol == "estudiante")
                {
                    if (curso.Id == 1 || curso.Id == 2)
                    {
                        cursos.Add(new { id = curso.Id, codigo = curso.Codigo, nombre = curso.Nombre, periodo = curso.Periodo, descripcion = curso.Descripcion, docenteId = curso.DocenteId, docente = docente?.Nombre ?? "Sin docente", estudiantes = 1 });
                    }
                }
            }
            return cursos;
        }

        public static string Hash(string value)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(value ?? string.Empty);
                var hash = sha256.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }
    }
}
