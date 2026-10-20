using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using HomeClassApi.Controllers;
using HomeClassApi.Models;
using HomeClassApi.Services;

namespace HomeClassApi.Controllers
{
    [RoutePrefix("api")]
    public class DashboardController : ApiController
    {
        private IHttpActionResult Error(HttpStatusCode status, string mensaje)
        {
            return ResponseMessage(Request.CreateResponse(status, new RespuestaError { Mensaje = mensaje }));
        }

        [HttpGet]
        [Route("dashboard")]
        public IHttpActionResult GetDashboard()
        {
            var usuario = AuthController.ObtenerUsuarioActual();
            if (usuario == null)
            {
                return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            }

            var usuarios = AuthService.ObtenerUsuarios();
            var cursos = AuthService.ObtenerCursos(usuario.Rol, usuario.Id).ToList();

            if (usuario.Rol == "admin")
            {
                return Ok(new
                {
                    rol = usuario.Rol,
                    usuarios = new
                    {
                        total = usuarios.Count,
                        admins = usuarios.Count(u => u.Rol == "admin"),
                        docentes = usuarios.Count(u => u.Rol == "docente"),
                        estudiantes = usuarios.Count(u => u.Rol == "estudiante"),
                        inactivos = usuarios.Count(u => !u.Activo)
                    },
                    cursos,
                    promedioGeneral = 86.4,
                    asistenciaGeneral = 88.5,
                    riesgo = new { alto = 1, moderado = 2, bajo = 5 }
                });
            }

            if (usuario.Rol == "docente")
            {
                return Ok(new
                {
                    rol = usuario.Rol,
                    cursos,
                    porRevisar = 3,
                    enRiesgoAlto = 1,
                    promedioGeneral = 84.2,
                    alertas = new[]
                    {
                        new { estudianteId = 3, nombre = "Estudiante Uno", cursoId = 1, curso = "Programación I", riesgo = "alto", promedio = 68.5, asistencia = 72.0 }
                    },
                    proximas = new[]
                    {
                        new { evaluacionId = 1, cursoId = 1, curso = "Programación I", nombre = "Tarea 1", tipo = "tarea", fecha = "2026-10-25" }
                    }
                });
            }

            return Ok(new
            {
                rol = usuario.Rol,
                promedio = 78.5,
                asistencia = 83.0,
                cursos,
                pendientes = new[]
                {
                    new { evaluacionId = 1, cursoId = 1, curso = "Programación I", nombre = "Tarea 1", tipo = "tarea", fecha = "2026-10-25", vencida = false }
                }
            });
        }
    }
}
