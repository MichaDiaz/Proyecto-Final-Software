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
    [RoutePrefix("api/usuarios")]
    public class UsuariosController : ApiController
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

            if (usuarioActual.Rol != "admin")
            {
                return Error(HttpStatusCode.Forbidden, "No tienes permisos para consultar usuarios.");
            }

            return Ok(AuthService.ObtenerUsuarios());
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Crear(UsuarioRespuesta usuario)
        {
            var usuarioActual = AuthController.ObtenerUsuarioActual();
            if (usuarioActual == null)
            {
                return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            }

            if (usuarioActual.Rol != "admin")
            {
                return Error(HttpStatusCode.Forbidden, "Solo el administrador puede crear usuarios.");
            }

            return Ok(new
            {
                id = 99,
                nombre = usuario.Nombre,
                correo = usuario.Correo,
                rol = usuario.Rol,
                activo = true
            });
        }
    }
}
