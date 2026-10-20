using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using HomeClassApi.Controllers;
using HomeClassApi.Models;
using HomeClassApi.Services;

namespace HomeClassApi.Controllers
{
    [RoutePrefix("api/cursos")]
    public class CursosController : ApiController
    {
        private IHttpActionResult Error(HttpStatusCode status, string mensaje)
        {
            return ResponseMessage(Request.CreateResponse(status, new RespuestaError { Mensaje = mensaje }));
        }

        [HttpGet]
        [Route("")]
        public IHttpActionResult Listar()
        {
            var usuarioActual = AuthController.ObtenerUsuarioActual();
            if (usuarioActual == null)
            {
                return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            }

            return Ok(AuthService.ObtenerCursos(usuarioActual.Rol, usuarioActual.Id));
        }

        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Obtener(int id)
        {
            var usuarioActual = AuthController.ObtenerUsuarioActual();
            if (usuarioActual == null)
            {
                return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            }

            var curso = AuthService.ObtenerCursos(usuarioActual.Rol, usuarioActual.Id).FirstOrDefault(x => ((dynamic)x).id == id);
            if (curso == null)
            {
                return Error(HttpStatusCode.NotFound, "Curso no encontrado.");
            }

            return Ok(curso);
        }
    }
}
