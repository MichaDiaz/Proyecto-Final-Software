using System.Data;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using HomeClassApi.Models;
using HomeClassApi.Services;

namespace HomeClassApi.Controllers
{
    [RoutePrefix("api/perfil")]
    public class PerfilController : ApiController
    {
        private IHttpActionResult Error(HttpStatusCode status, string mensaje)
        {
            return ResponseMessage(Request.CreateResponse(status, new RespuestaError { Mensaje = mensaje }));
        }

        [HttpPut]
        [Route("")]
        public IHttpActionResult Actualizar(PerfilRequest request)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (request == null || string.IsNullOrWhiteSpace(request.Nombre)) return Error(HttpStatusCode.BadRequest, "El nombre es obligatorio.");
            SqlData.Execute("UPDATE dbo.Usuario SET Nombre=@Nombre WHERE Id=@Id",
                SqlData.Param("@Nombre", SqlDbType.NVarChar, request.Nombre.Trim(), 100),
                SqlData.Param("@Id", SqlDbType.Int, actual.Id));
            var actualizado = AuthService.ObtenerPorId(actual.Id);
            AuthController.ActualizarSesion(actualizado);
            return Ok(actualizado);
        }

        [HttpPut]
        [Route("clave")]
        public IHttpActionResult CambiarClave(CambioClaveRequest request)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (request == null || string.IsNullOrWhiteSpace(request.Actual) || string.IsNullOrWhiteSpace(request.Nueva) || request.Nueva.Length < 8)
                return Error(HttpStatusCode.BadRequest, "La nueva contraseña debe tener al menos 8 caracteres.");
            var cuenta = AuthService.BuscarPorCorreo(actual.Correo);
            if (cuenta == null || !AuthService.VerificarClave(request.Actual, cuenta.ClaveHash))
                return Error(HttpStatusCode.BadRequest, "La contraseña actual no coincide.");
            SqlData.Execute("UPDATE dbo.Usuario SET ClaveHash=@Hash WHERE Id=@Id",
                SqlData.Param("@Hash", SqlDbType.VarChar, AuthService.Hash(request.Nueva), 120),
                SqlData.Param("@Id", SqlDbType.Int, actual.Id));
            return StatusCode(HttpStatusCode.NoContent);
        }
    }
}