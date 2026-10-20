using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using HomeClassApi.Models;
using HomeClassApi.Services;

namespace HomeClassApi.Controllers
{
    [RoutePrefix("api/auth")]
    public class AuthController : ApiController
    {
        private static readonly Dictionary<string, UsuarioRespuesta> Tokens = new Dictionary<string, UsuarioRespuesta>(StringComparer.OrdinalIgnoreCase);

        private IHttpActionResult Error(HttpStatusCode status, string mensaje)
        {
            return ResponseMessage(Request.CreateResponse(status, new RespuestaError { Mensaje = mensaje }));
        }

        [HttpPost]
        [Route("login")]
        public IHttpActionResult Login(LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Clave))
            {
                return Error(HttpStatusCode.BadRequest, "Correo y contraseña son obligatorios.");
            }

            var usuario = AuthService.ValidarLogin(request.Correo, request.Clave);
            if (usuario == null)
            {
                return Error(HttpStatusCode.Unauthorized, "Correo o contraseña incorrectos.");
            }

            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            lock (Tokens)
            {
                Tokens[token] = usuario;
            }

            return Ok(new
            {
                token,
                usuario = usuario
            });
        }

        [HttpGet]
        [Route("sesion")]
        public IHttpActionResult Sesion()
        {
            var usuario = ObtenerUsuarioActual();
            if (usuario == null)
            {
                return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            }

            return Ok(usuario);
        }

        internal static UsuarioRespuesta ObtenerUsuarioActual()
        {
            var request = HttpContext.Current?.Request;
            if (request == null) return null;

            var header = request.Headers["Authorization"];
            if (string.IsNullOrWhiteSpace(header)) return null;

            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;

            var token = header.Substring("Bearer ".Length).Trim();
            if (string.IsNullOrWhiteSpace(token)) return null;

            lock (Tokens)
            {
                if (Tokens.TryGetValue(token, out var usuario))
                {
                    return usuario;
                }
            }

            return null;
        }
    }
}
