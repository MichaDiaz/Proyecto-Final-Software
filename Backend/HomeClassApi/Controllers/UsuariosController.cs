using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Data;
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
        public IHttpActionResult Crear(UsuarioRequest usuario)
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

            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Nombre) || string.IsNullOrWhiteSpace(usuario.Correo) ||
                string.IsNullOrWhiteSpace(usuario.Clave) || usuario.Clave.Length < 8 ||
                !new[] { "admin", "docente", "estudiante" }.Contains(usuario.Rol))
            {
                return Error(HttpStatusCode.BadRequest, "Revisa los datos del usuario; la contraseña debe tener al menos 8 caracteres.");
            }

            try
            {
                var id = Convert.ToInt32(SqlData.Scalar(
                    "INSERT dbo.Usuario (Nombre, Correo, ClaveHash, Rol, Activo) OUTPUT INSERTED.Id VALUES (@Nombre, @Correo, @ClaveHash, @Rol, 1)",
                    SqlData.Param("@Nombre", SqlDbType.NVarChar, usuario.Nombre.Trim(), 100),
                    SqlData.Param("@Correo", SqlDbType.NVarChar, usuario.Correo.Trim(), 254),
                    SqlData.Param("@ClaveHash", SqlDbType.VarChar, AuthService.Hash(usuario.Clave), 120),
                    SqlData.Param("@Rol", SqlDbType.VarChar, usuario.Rol, 20)));
                return Ok(AuthService.ObtenerPorId(id));
            }
            catch (System.Data.SqlClient.SqlException ex) when (ex.Number == 2601 || ex.Number == 2627)
            {
                return Error(HttpStatusCode.Conflict, "Ya existe un usuario con ese correo.");
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Actualizar(int id, UsuarioRequest usuario)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (actual.Rol != "admin") return Error(HttpStatusCode.Forbidden, "Solo el administrador puede editar usuarios.");
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Nombre) || string.IsNullOrWhiteSpace(usuario.Correo) ||
                !new[] { "admin", "docente", "estudiante" }.Contains(usuario.Rol))
                return Error(HttpStatusCode.BadRequest, "Revisa los datos del usuario.");
            if (id == actual.Id && (!usuario.Activo || usuario.Rol != "admin"))
                return Error(HttpStatusCode.Conflict, "No puedes desactivar tu cuenta ni cambiar tu propio rol.");

            try
            {
                var count = SqlData.Execute(
                    "UPDATE dbo.Usuario SET Nombre = @Nombre, Correo = @Correo, Rol = @Rol, Activo = @Activo WHERE Id = @Id",
                    SqlData.Param("@Nombre", SqlDbType.NVarChar, usuario.Nombre.Trim(), 100),
                    SqlData.Param("@Correo", SqlDbType.NVarChar, usuario.Correo.Trim(), 254),
                    SqlData.Param("@Rol", SqlDbType.VarChar, usuario.Rol, 20),
                    SqlData.Param("@Activo", SqlDbType.Bit, usuario.Activo),
                    SqlData.Param("@Id", SqlDbType.Int, id));
                if (count == 0) return Error(HttpStatusCode.NotFound, "Usuario no encontrado.");
                return Ok(AuthService.ObtenerPorId(id));
            }
            catch (System.Data.SqlClient.SqlException ex) when (ex.Number == 2601 || ex.Number == 2627)
            {
                return Error(HttpStatusCode.Conflict, "Ya existe un usuario con ese correo.");
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Eliminar(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (actual.Rol != "admin") return Error(HttpStatusCode.Forbidden, "Solo el administrador puede eliminar usuarios.");
            if (id == actual.Id) return Error(HttpStatusCode.Conflict, "No puedes eliminar tu propia cuenta.");
            var usuario = AuthService.ObtenerPorId(id);
            if (usuario == null) return Error(HttpStatusCode.NotFound, "Usuario no encontrado.");
            if (usuario.Rol == "docente" && Convert.ToInt32(SqlData.Scalar("SELECT COUNT(*) FROM dbo.Curso WHERE DocenteId = @Id", SqlData.Param("@Id", SqlDbType.Int, id))) > 0)
                return Error(HttpStatusCode.Conflict, "No puedes eliminar un docente con cursos asignados.");
            var archivos = usuario.Rol == "estudiante"
                ? SqlData.Query("SELECT RutaInterna AS ruta FROM dbo.Entrega WHERE EstudianteId=@Id", SqlData.Param("@Id", SqlDbType.Int, id))
                : new List<System.Collections.Generic.Dictionary<string, object>>();
            SqlData.Execute("DELETE FROM dbo.Usuario WHERE Id = @Id", SqlData.Param("@Id", SqlDbType.Int, id));
            foreach (var archivo in archivos) AcademicoController.EliminarArchivoPrivado(System.Convert.ToString(archivo["ruta"]));
            return StatusCode(HttpStatusCode.NoContent);
        }
    }
}
