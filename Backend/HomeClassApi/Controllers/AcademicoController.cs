using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web.Http;
using System.Net.Http.Formatting;
using System.Configuration;
using System.Collections.Specialized;
using HomeClassApi.Models;
using HomeClassApi.Services;

namespace HomeClassApi.Controllers
{
    [RoutePrefix("api")]
    public class AcademicoController : ApiController
    {
        private static readonly HashSet<string> ExtensionesGlobales = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "txt", "md", "csv", "zip", "rar", "7z", "png", "jpg", "jpeg", "sql", "c", "cs", "js", "py", "java"
        };

        private static string DirectorioArchivos
        {
            get
            {
                var configurado = ConfigurationManager.AppSettings["HomeClassUploadPath"];
                var ruta = string.IsNullOrWhiteSpace(configurado)
                    ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HomeClass", "Uploads")
                    : Environment.ExpandEnvironmentVariables(configurado);
                Directory.CreateDirectory(ruta);
                return Path.GetFullPath(ruta).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            }
        }

        private IHttpActionResult Error(HttpStatusCode status, string mensaje)
        {
            return ResponseMessage(Request.CreateResponse(status, new RespuestaError { Mensaje = mensaje }));
        }

        [HttpGet]
        [Route("cursos/{cursoId:int}/evaluaciones")]
        public IHttpActionResult ListarEvaluaciones(int cursoId)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (!PuedeAcceder(actual, cursoId)) return Error(HttpStatusCode.NotFound, "Curso no encontrado.");
            return Ok(SqlData.Query("SELECT Id AS id, CursoId AS cursoId, Nombre AS nombre, Tipo AS tipo, Peso AS peso, CONVERT(VARCHAR(10), Fecha, 23) AS fecha, Instrucciones AS instrucciones, RequiereEntrega AS requiereEntrega, Extensiones AS extensiones, MaxMb AS maxMb, PermiteTardia AS permiteTardia FROM dbo.Evaluacion WHERE CursoId=@CursoId ORDER BY Fecha",
                SqlData.Param("@CursoId", SqlDbType.Int, cursoId)));
        }

        [HttpPost]
        [Route("cursos/{cursoId:int}/evaluaciones")]
        public IHttpActionResult CrearEvaluacion(int cursoId, EvaluacionRequest request)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (!EsDocenteDelCurso(actual, cursoId)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede administrar evaluaciones.");
            var error = ValidarEvaluacion(request);
            if (error != null) return Error(HttpStatusCode.BadRequest, error);
            var pesoActual = Convert.ToDecimal(SqlData.Scalar("SELECT COALESCE(SUM(Peso),0) FROM dbo.Evaluacion WHERE CursoId=@CursoId", SqlData.Param("@CursoId", SqlDbType.Int, cursoId)));
            if (pesoActual + request.Peso > 100) return Error(HttpStatusCode.Conflict, "La suma de los pesos del curso no puede superar 100%.");
            var id = Convert.ToInt32(SqlData.Scalar("INSERT dbo.Evaluacion (CursoId,Nombre,Tipo,Peso,Fecha,Instrucciones,RequiereEntrega,Extensiones,MaxMb,PermiteTardia) OUTPUT INSERTED.Id VALUES (@CursoId,@Nombre,@Tipo,@Peso,@Fecha,@Instrucciones,@RequiereEntrega,@Extensiones,@MaxMb,@PermiteTardia)",
                ParamEvaluacion(cursoId, request)));
            return Ok(ObtenerEvaluacion(id));
        }

        [HttpPut]
        [Route("evaluaciones/{id:int}")]
        public IHttpActionResult ActualizarEvaluacion(int id, EvaluacionRequest request)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            var cursoId = ObtenerCursoEvaluacion(id);
            if (!cursoId.HasValue) return Error(HttpStatusCode.NotFound, "Evaluación no encontrada.");
            if (!EsDocenteDelCurso(actual, cursoId.Value)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede administrar evaluaciones.");
            var error = ValidarEvaluacion(request);
            if (error != null) return Error(HttpStatusCode.BadRequest, error);
            var pesoActual = Convert.ToDecimal(SqlData.Scalar("SELECT COALESCE(SUM(Peso),0) FROM dbo.Evaluacion WHERE CursoId=@CursoId AND Id<>@Id",
                SqlData.Param("@CursoId", SqlDbType.Int, cursoId.Value), SqlData.Param("@Id", SqlDbType.Int, id)));
            if (pesoActual + request.Peso > 100) return Error(HttpStatusCode.Conflict, "La suma de los pesos del curso no puede superar 100%.");
            var parametros = ParamEvaluacion(cursoId.Value, request).Concat(new[] { SqlData.Param("@Id", SqlDbType.Int, id) }).ToArray();
            SqlData.Execute("UPDATE dbo.Evaluacion SET Nombre=@Nombre,Tipo=@Tipo,Peso=@Peso,Fecha=@Fecha,Instrucciones=@Instrucciones,RequiereEntrega=@RequiereEntrega,Extensiones=@Extensiones,MaxMb=@MaxMb,PermiteTardia=@PermiteTardia WHERE Id=@Id", parametros);
            return Ok(ObtenerEvaluacion(id));
        }

        [HttpDelete]
        [Route("evaluaciones/{id:int}")]
        public IHttpActionResult EliminarEvaluacion(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            var cursoId = ObtenerCursoEvaluacion(id);
            if (!cursoId.HasValue) return Error(HttpStatusCode.NotFound, "Evaluación no encontrada.");
            if (!EsDocenteDelCurso(actual, cursoId.Value)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede administrar evaluaciones.");
            var archivos = SqlData.Query("SELECT RutaInterna AS ruta FROM dbo.Entrega WHERE EvaluacionId=@Id", SqlData.Param("@Id", SqlDbType.Int, id));
            SqlData.Execute("DELETE FROM dbo.Evaluacion WHERE Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id));
            foreach (var archivo in archivos) EliminarArchivo(Convert.ToString(archivo["ruta"]));
            return StatusCode(HttpStatusCode.NoContent);
        }

        [HttpGet]
        [Route("cursos/{cursoId:int}/libro")]
        public IHttpActionResult Libro(int cursoId)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (!EsDocenteDelCurso(actual, cursoId)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede consultar el libro.");
            var evaluaciones = (List<Dictionary<string, object>>)SqlData.Query("SELECT Id AS id,CursoId AS cursoId,Nombre AS nombre,Tipo AS tipo,Peso AS peso,CONVERT(VARCHAR(10),Fecha,23) AS fecha,Instrucciones AS instrucciones,RequiereEntrega AS requiereEntrega,Extensiones AS extensiones,MaxMb AS maxMb,PermiteTardia AS permiteTardia FROM dbo.Evaluacion WHERE CursoId=@CursoId ORDER BY Fecha",
                SqlData.Param("@CursoId", SqlDbType.Int, cursoId));
            var filas = SqlData.Query("SELECT u.Id AS estudianteId,u.Nombre AS nombre,CAST(NULL AS DECIMAL(5,2)) AS promedio,CAST(NULL AS DECIMAL(5,2)) AS asistencia,'sin-datos' AS riesgo FROM dbo.Inscripcion i JOIN dbo.Usuario u ON u.Id=i.EstudianteId WHERE i.CursoId=@CursoId ORDER BY u.Nombre",
                SqlData.Param("@CursoId", SqlDbType.Int, cursoId));
            foreach (var fila in filas)
            {
                var metricas = MetricasEstudiante(cursoId, Convert.ToInt32(fila["estudianteId"]));
                fila["promedio"] = metricas.promedio;
                fila["asistencia"] = metricas.asistencia;
                fila["riesgo"] = NivelRiesgo(metricas.promedio, metricas.asistencia);
                var notas = new Dictionary<string, object>();
                var entregas = new Dictionary<string, bool>();
                foreach (var evaluacion in evaluaciones)
                {
                    var evaluacionId = Convert.ToInt32(evaluacion["id"]);
                    var nota = SqlData.Scalar("SELECT Nota FROM dbo.Calificacion WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId",
                        SqlData.Param("@EvaluacionId", SqlDbType.Int, evaluacionId), SqlData.Param("@EstudianteId", SqlDbType.Int, fila["estudianteId"]));
                    var entrega = SqlData.Scalar("SELECT COUNT(*) FROM dbo.Entrega WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId",
                        SqlData.Param("@EvaluacionId", SqlDbType.Int, evaluacionId), SqlData.Param("@EstudianteId", SqlDbType.Int, fila["estudianteId"]));
                    notas[evaluacionId.ToString()] = nota == null || nota == DBNull.Value ? null : nota;
                    entregas[evaluacionId.ToString()] = Convert.ToInt32(entrega) > 0;
                }
                fila["notas"] = notas;
                fila["entregas"] = entregas;
            }
            return Ok(new { evaluaciones, filas });
        }

        [HttpPut]
        [Route("evaluaciones/{evaluacionId:int}/notas/{estudianteId:int}")]
        public IHttpActionResult GuardarNota(int evaluacionId, int estudianteId, NotaRequest request)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            var cursoId = ObtenerCursoEvaluacion(evaluacionId);
            if (!cursoId.HasValue) return Error(HttpStatusCode.NotFound, "Evaluación no encontrada.");
            if (request == null || (request.Nota.HasValue && (request.Nota.Value < 0 || request.Nota.Value > 100))) return Error(HttpStatusCode.BadRequest, "La nota debe estar entre 0 y 100.");
            if (Convert.ToInt32(SqlData.Scalar("SELECT COUNT(*) FROM dbo.Inscripcion WHERE CursoId=@CursoId AND EstudianteId=@EstudianteId", SqlData.Param("@CursoId", SqlDbType.Int, cursoId.Value), SqlData.Param("@EstudianteId", SqlDbType.Int, estudianteId))) == 0)
                return Error(HttpStatusCode.NotFound, "El estudiante no está matriculado en este curso.");
            SqlData.Execute("IF EXISTS (SELECT 1 FROM dbo.Calificacion WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId) UPDATE dbo.Calificacion SET Nota=@Nota WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId ELSE INSERT dbo.Calificacion (EvaluacionId,EstudianteId,Nota) VALUES (@EvaluacionId,@EstudianteId,@Nota)",
                SqlData.Param("@EvaluacionId", SqlDbType.Int, evaluacionId), SqlData.Param("@EstudianteId", SqlDbType.Int, estudianteId), SqlData.Param("@Nota", SqlDbType.Decimal, request.Nota));
            var promedio = SqlData.Scalar("SELECT SUM(g.Nota*e.Peso)/NULLIF(SUM(CASE WHEN g.Nota IS NOT NULL THEN e.Peso END),0) FROM dbo.Evaluacion e LEFT JOIN dbo.Calificacion g ON g.EvaluacionId=e.Id AND g.EstudianteId=@EstudianteId WHERE e.CursoId=@CursoId",
                SqlData.Param("@EstudianteId", SqlDbType.Int, estudianteId), SqlData.Param("@CursoId", SqlDbType.Int, cursoId.Value));
            var asistencia = SqlData.Scalar("SELECT 100.0*SUM(CASE WHEN Presente=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0) FROM dbo.Asistencia WHERE CursoId=@CursoId AND EstudianteId=@EstudianteId",
                SqlData.Param("@CursoId", SqlDbType.Int, cursoId.Value), SqlData.Param("@EstudianteId", SqlDbType.Int, estudianteId));
            var promedioDecimal = DecimalNullable(promedio);
            var asistenciaDecimal = DecimalNullable(asistencia);
            return Ok(new { promedio = promedioDecimal, riesgo = NivelRiesgo(promedioDecimal, asistenciaDecimal) });
        }

        [HttpGet]
        [Route("cursos/{cursoId:int}/asistencia")]
        public IHttpActionResult ObtenerAsistencia(int cursoId, string fecha)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (!EsDocenteDelCurso(actual, cursoId)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede consultar asistencia.");
            DateTime dia;
            if (!DateTime.TryParse(fecha, out dia)) return Error(HttpStatusCode.BadRequest, "La fecha no es válida.");
            var registros = SqlData.Query("SELECT u.Id AS estudianteId,u.Nombre AS nombre,COALESCE(a.Presente,1) AS presente FROM dbo.Inscripcion i JOIN dbo.Usuario u ON u.Id=i.EstudianteId LEFT JOIN dbo.Asistencia a ON a.CursoId=i.CursoId AND a.EstudianteId=i.EstudianteId AND a.Fecha=@Fecha WHERE i.CursoId=@CursoId ORDER BY u.Nombre",
                SqlData.Param("@Fecha", SqlDbType.Date, dia.Date), SqlData.Param("@CursoId", SqlDbType.Int, cursoId));
            var registrada = Convert.ToInt32(SqlData.Scalar("SELECT COUNT(*) FROM dbo.Asistencia WHERE CursoId=@CursoId AND Fecha=@Fecha", SqlData.Param("@CursoId", SqlDbType.Int, cursoId), SqlData.Param("@Fecha", SqlDbType.Date, dia.Date))) > 0;
            return Ok(new { fecha = dia.ToString("yyyy-MM-dd"), registrada, registros });
        }

        [HttpPut]
        [Route("cursos/{cursoId:int}/asistencia")]
        public IHttpActionResult GuardarAsistencia(int cursoId, AsistenciaRequest request)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (!EsDocenteDelCurso(actual, cursoId)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede registrar asistencia.");
            DateTime dia;
            if (request == null || !DateTime.TryParse(request.Fecha, out dia) || request.Registros == null) return Error(HttpStatusCode.BadRequest, "La fecha y los registros son obligatorios.");
            var matriculados = SqlData.Query("SELECT EstudianteId FROM dbo.Inscripcion WHERE CursoId=@CursoId", SqlData.Param("@CursoId", SqlDbType.Int, cursoId)).Select(r => Convert.ToInt32(r["EstudianteId"])).ToHashSet();
            if (request.Registros.Any(r => !matriculados.Contains(r.EstudianteId)) || request.Registros.Select(r => r.EstudianteId).Distinct().Count() != request.Registros.Count)
                return Error(HttpStatusCode.BadRequest, "La lista contiene estudiantes no matriculados o repetidos.");
            SqlData.Execute("DELETE FROM dbo.Asistencia WHERE CursoId=@CursoId AND Fecha=@Fecha", SqlData.Param("@CursoId", SqlDbType.Int, cursoId), SqlData.Param("@Fecha", SqlDbType.Date, dia.Date));
            foreach (var registro in request.Registros)
                SqlData.Execute("INSERT dbo.Asistencia (CursoId,EstudianteId,Fecha,Presente) VALUES (@CursoId,@EstudianteId,@Fecha,@Presente)",
                    SqlData.Param("@CursoId", SqlDbType.Int, cursoId), SqlData.Param("@EstudianteId", SqlDbType.Int, registro.EstudianteId),
                    SqlData.Param("@Fecha", SqlDbType.Date, dia.Date), SqlData.Param("@Presente", SqlDbType.Bit, registro.Presente));
            return StatusCode(HttpStatusCode.NoContent);
        }

        [HttpGet]
        [Route("cursos/{cursoId:int}/materiales")]
        public IHttpActionResult ListarMateriales(int cursoId)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (!PuedeAcceder(actual, cursoId)) return Error(HttpStatusCode.NotFound, "Curso no encontrado.");
            return Ok(SqlData.Query("SELECT Id AS id,CursoId AS cursoId,Titulo AS titulo,NombreOriginal AS nombreOriginal,Tamano AS tamano,Fecha AS fecha FROM dbo.Material WHERE CursoId=@CursoId ORDER BY Fecha DESC",
                SqlData.Param("@CursoId", SqlDbType.Int, cursoId)));
        }

        [HttpPost]
        [Route("cursos/{cursoId:int}/materiales")]
        public async Task<IHttpActionResult> SubirMaterial(int cursoId)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (!EsDocenteDelCurso(actual, cursoId)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede subir materiales.");
            var subida = await LeerArchivo();
            if (subida.Error != null) return Error(HttpStatusCode.BadRequest, subida.Error);
            var titulo = Request.Content.Headers.ContentType == null ? null : subida.Formulario["titulo"];
            if (string.IsNullOrWhiteSpace(titulo))
            {
                BorrarArchivoTemporal(subida.Temporal);
                return Error(HttpStatusCode.BadRequest, "El título del material es obligatorio.");
            }
            var destino = GuardarArchivo(subida.Temporal);
            try
            {
                var id = Convert.ToInt32(SqlData.Scalar("INSERT dbo.Material (CursoId,Titulo,NombreOriginal,RutaInterna,Tamano) OUTPUT INSERTED.Id VALUES (@CursoId,@Titulo,@Nombre,@Ruta,@Tamano)",
                    SqlData.Param("@CursoId", SqlDbType.Int, cursoId), SqlData.Param("@Titulo", SqlDbType.NVarChar, titulo.Trim(), 150),
                    SqlData.Param("@Nombre", SqlDbType.NVarChar, subida.Nombre, 255), SqlData.Param("@Ruta", SqlDbType.NVarChar, destino, 1000),
                    SqlData.Param("@Tamano", SqlDbType.BigInt, subida.Tamano)));
                return Ok(SqlData.Query("SELECT Id AS id,CursoId AS cursoId,Titulo AS titulo,NombreOriginal AS nombreOriginal,Tamano AS tamano,Fecha AS fecha FROM dbo.Material WHERE Id=@Id",
                    SqlData.Param("@Id", SqlDbType.Int, id)).FirstOrDefault());
            }
            catch
            {
                EliminarArchivo(destino);
                throw;
            }
        }

        [HttpDelete]
        [Route("materiales/{id:int}")]
        public IHttpActionResult EliminarMaterial(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            var material = SqlData.Query("SELECT CursoId AS cursoId,RutaInterna AS ruta FROM dbo.Material WHERE Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id)).FirstOrDefault();
            if (material == null) return Error(HttpStatusCode.NotFound, "Material no encontrado.");
            if (!EsDocenteDelCurso(actual, Convert.ToInt32(material["cursoId"]))) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede eliminar materiales.");
            SqlData.Execute("DELETE FROM dbo.Material WHERE Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id));
            EliminarArchivo(Convert.ToString(material["ruta"]));
            return StatusCode(HttpStatusCode.NoContent);
        }

        [HttpGet]
        [Route("materiales/{id:int}/archivo")]
        public IHttpActionResult DescargarMaterial(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            var material = SqlData.Query("SELECT CursoId AS cursoId,NombreOriginal AS nombre,RutaInterna AS ruta FROM dbo.Material WHERE Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id)).FirstOrDefault();
            if (material == null) return Error(HttpStatusCode.NotFound, "Material no encontrado.");
            if (!PuedeAcceder(actual, Convert.ToInt32(material["cursoId"]))) return Error(HttpStatusCode.Forbidden, "No tienes permiso para descargar este material.");
            return Descargar(Convert.ToString(material["ruta"]), Convert.ToString(material["nombre"]));
        }

        [HttpGet]
        [Route("evaluaciones/{id:int}/entregas")]
        public IHttpActionResult ListarEntregas(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            var cursoId = ObtenerCursoEvaluacion(id);
            if (!cursoId.HasValue) return Error(HttpStatusCode.NotFound, "Evaluación no encontrada.");
            if (!EsDocenteDelCurso(actual, cursoId.Value)) return Error(HttpStatusCode.Forbidden, "Solo el docente del curso puede revisar entregas.");
            var evaluacion = ObtenerEvaluacion(id);
            var filas = SqlData.Query("SELECT u.Id AS estudianteId,u.Nombre AS nombre,e.Id AS entregaId,e.EvaluacionId AS evaluacionId,e.NombreOriginal AS nombreOriginal,e.Tamano AS tamano,e.Fecha AS fecha,e.Tardia AS tardia,e.Comentario AS comentario,g.Nota AS nota FROM dbo.Inscripcion i JOIN dbo.Usuario u ON u.Id=i.EstudianteId LEFT JOIN dbo.Entrega e ON e.EvaluacionId=@EvaluacionId AND e.EstudianteId=u.Id LEFT JOIN dbo.Calificacion g ON g.EvaluacionId=@EvaluacionId AND g.EstudianteId=u.Id WHERE i.CursoId=@CursoId ORDER BY u.Nombre",
                SqlData.Param("@EvaluacionId", SqlDbType.Int, id), SqlData.Param("@CursoId", SqlDbType.Int, cursoId.Value));
            foreach (var fila in filas)
            {
                fila["entrega"] = fila["entregaId"] == null ? null : new Dictionary<string, object>
                {
                    ["id"] = fila["entregaId"], ["evaluacionId"] = fila["evaluacionId"], ["estudianteId"] = fila["estudianteId"],
                    ["nombreOriginal"] = fila["nombreOriginal"], ["tamano"] = fila["tamano"], ["fecha"] = fila["fecha"],
                    ["tardia"] = fila["tardia"], ["comentario"] = fila["comentario"]
                };
                fila.Remove("entregaId"); fila.Remove("evaluacionId"); fila.Remove("nombreOriginal"); fila.Remove("tamano");
                fila.Remove("fecha"); fila.Remove("tardia"); fila.Remove("comentario");
            }
            return Ok(new { evaluacion, filas });
        }

        [HttpPost]
        [Route("evaluaciones/{id:int}/entrega")]
        public async Task<IHttpActionResult> Entregar(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (actual.Rol != "estudiante") return Error(HttpStatusCode.Forbidden, "Solo un estudiante puede entregar archivos.");
            var evaluacion = SqlData.Query("SELECT e.*,c.Id AS cursoId FROM dbo.Evaluacion e JOIN dbo.Curso c ON c.Id=e.CursoId WHERE e.Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id)).FirstOrDefault();
            if (evaluacion == null) return Error(HttpStatusCode.NotFound, "Evaluación no encontrada.");
            var cursoId = Convert.ToInt32(evaluacion["cursoId"]);
            if (!PuedeAcceder(actual, cursoId)) return Error(HttpStatusCode.Forbidden, "No estás matriculado en este curso.");
            if (!(bool)evaluacion["RequiereEntrega"]) return Error(HttpStatusCode.Conflict, "Esta evaluación no recibe archivos.");
            var calificada = SqlData.Scalar("SELECT Nota FROM dbo.Calificacion WHERE EvaluacionId=@Id AND EstudianteId=@EstudianteId", SqlData.Param("@Id", SqlDbType.Int, id), SqlData.Param("@EstudianteId", SqlDbType.Int, actual.Id));
            if (calificada != null && calificada != DBNull.Value) return Error(HttpStatusCode.Conflict, "Una entrega calificada ya no se puede reemplazar.");
            var fecha = Convert.ToDateTime(evaluacion["Fecha"]);
            var tardia = DateTime.Today > fecha.Date;
            if (tardia && !(bool)evaluacion["PermiteTardia"]) return Error(HttpStatusCode.Conflict, "El plazo de entrega ya venció.");
            var subida = await LeerArchivo();
            if (subida.Error != null) return Error(HttpStatusCode.BadRequest, subida.Error);
            var permitidas = Convert.ToString(evaluacion["Extensiones"]).Split(',').Select(x => x.Trim().TrimStart('.')).Where(x => x.Length > 0);
            if (!permitidas.Contains(subida.Extension, StringComparer.OrdinalIgnoreCase))
            {
                BorrarArchivoTemporal(subida.Temporal);
                return Error(HttpStatusCode.BadRequest, "El tipo de archivo no está permitido por esta evaluación.");
            }
            if (subida.Tamano > Math.Min(25, Convert.ToInt32(evaluacion["MaxMb"])) * 1024L * 1024L)
            {
                BorrarArchivoTemporal(subida.Temporal);
                return Error(HttpStatusCode.BadRequest, "El archivo supera el tamaño permitido.");
            }
            var comentario = subida.Formulario["comentario"] ?? string.Empty;
            var anterior = SqlData.Query("SELECT RutaInterna AS ruta FROM dbo.Entrega WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId", SqlData.Param("@EvaluacionId", SqlDbType.Int, id), SqlData.Param("@EstudianteId", SqlDbType.Int, actual.Id)).FirstOrDefault();
            var ruta = GuardarArchivo(subida.Temporal);
            try
            {
                SqlData.Execute("IF EXISTS (SELECT 1 FROM dbo.Entrega WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId) UPDATE dbo.Entrega SET NombreOriginal=@Nombre,RutaInterna=@Ruta,Tamano=@Tamano,Fecha=SYSUTCDATETIME(),Tardia=@Tardia,Comentario=@Comentario WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId ELSE INSERT dbo.Entrega (EvaluacionId,EstudianteId,NombreOriginal,RutaInterna,Tamano,Tardia,Comentario) VALUES (@EvaluacionId,@EstudianteId,@Nombre,@Ruta,@Tamano,@Tardia,@Comentario)",
                    SqlData.Param("@EvaluacionId", SqlDbType.Int, id), SqlData.Param("@EstudianteId", SqlDbType.Int, actual.Id), SqlData.Param("@Nombre", SqlDbType.NVarChar, subida.Nombre, 255),
                    SqlData.Param("@Ruta", SqlDbType.NVarChar, ruta, 1000), SqlData.Param("@Tamano", SqlDbType.BigInt, subida.Tamano), SqlData.Param("@Tardia", SqlDbType.Bit, tardia), SqlData.Param("@Comentario", SqlDbType.NVarChar, comentario, 500));
            }
            catch
            {
                EliminarArchivo(ruta);
                throw;
            }
            if (anterior != null) EliminarArchivo(Convert.ToString(anterior["ruta"]));
            return Ok(SqlData.Query("SELECT Id AS id,EvaluacionId AS evaluacionId,EstudianteId AS estudianteId,NombreOriginal AS nombreOriginal,Tamano AS tamano,Fecha AS fecha,Tardia AS tardia,Comentario AS comentario FROM dbo.Entrega WHERE EvaluacionId=@EvaluacionId AND EstudianteId=@EstudianteId",
                SqlData.Param("@EvaluacionId", SqlDbType.Int, id), SqlData.Param("@EstudianteId", SqlDbType.Int, actual.Id)).FirstOrDefault());
        }

        [HttpDelete]
        [Route("evaluaciones/{id:int}/entrega")]
        public IHttpActionResult RetirarEntrega(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            if (actual.Rol != "estudiante") return Error(HttpStatusCode.Forbidden, "Solo el estudiante puede retirar su entrega.");
            var calificada = SqlData.Scalar("SELECT Nota FROM dbo.Calificacion WHERE EvaluacionId=@Id AND EstudianteId=@EstudianteId", SqlData.Param("@Id", SqlDbType.Int, id), SqlData.Param("@EstudianteId", SqlDbType.Int, actual.Id));
            if (calificada != null && calificada != DBNull.Value) return Error(HttpStatusCode.Conflict, "Una entrega calificada ya no se puede retirar.");
            var entrega = SqlData.Query("SELECT RutaInterna AS ruta FROM dbo.Entrega WHERE EvaluacionId=@Id AND EstudianteId=@EstudianteId", SqlData.Param("@Id", SqlDbType.Int, id), SqlData.Param("@EstudianteId", SqlDbType.Int, actual.Id)).FirstOrDefault();
            if (entrega == null) return Error(HttpStatusCode.NotFound, "No tienes una entrega para retirar.");
            SqlData.Execute("DELETE FROM dbo.Entrega WHERE EvaluacionId=@Id AND EstudianteId=@EstudianteId", SqlData.Param("@Id", SqlDbType.Int, id), SqlData.Param("@EstudianteId", SqlDbType.Int, actual.Id));
            EliminarArchivo(Convert.ToString(entrega["ruta"]));
            return StatusCode(HttpStatusCode.NoContent);
        }

        [HttpGet]
        [Route("entregas/{id:int}/archivo")]
        public IHttpActionResult DescargarEntrega(int id)
        {
            var actual = AuthController.ObtenerUsuarioActual();
            if (actual == null) return Error(HttpStatusCode.Unauthorized, "Tu sesión expiró. Ingresa de nuevo.");
            var entrega = SqlData.Query("SELECT e.EstudianteId AS estudianteId,e.NombreOriginal AS nombre,e.RutaInterna AS ruta,c.Id AS cursoId FROM dbo.Entrega e JOIN dbo.Evaluacion v ON v.Id=e.EvaluacionId JOIN dbo.Curso c ON c.Id=v.CursoId WHERE e.Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id)).FirstOrDefault();
            if (entrega == null) return Error(HttpStatusCode.NotFound, "Entrega no encontrada.");
            var esPropietario = actual.Rol == "estudiante" && actual.Id == Convert.ToInt32(entrega["estudianteId"]);
            var esDocente = EsDocenteDelCurso(actual, Convert.ToInt32(entrega["cursoId"]));
            if (!esPropietario && !esDocente) return Error(HttpStatusCode.Forbidden, "No tienes permiso para descargar esta entrega.");
            return Descargar(Convert.ToString(entrega["ruta"]), Convert.ToString(entrega["nombre"]));
        }

        private static Dictionary<string, object> ObtenerEvaluacion(int id) => SqlData.Query("SELECT Id AS id,CursoId AS cursoId,Nombre AS nombre,Tipo AS tipo,Peso AS peso,CONVERT(VARCHAR(10),Fecha,23) AS fecha,Instrucciones AS instrucciones,RequiereEntrega AS requiereEntrega,Extensiones AS extensiones,MaxMb AS maxMb,PermiteTardia AS permiteTardia FROM dbo.Evaluacion WHERE Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id)).FirstOrDefault();

        private static int? ObtenerCursoEvaluacion(int id)
        {
            var curso = SqlData.Scalar("SELECT CursoId FROM dbo.Evaluacion WHERE Id=@Id", SqlData.Param("@Id", SqlDbType.Int, id));
            return curso == null || curso == DBNull.Value ? (int?)null : Convert.ToInt32(curso);
        }

        private bool PuedeAcceder(UsuarioRespuesta actual, int cursoId) =>
            AuthService.ObtenerCursos(actual.Rol, actual.Id).Cast<Dictionary<string, object>>().Any(c => Convert.ToInt32(c["id"]) == cursoId);

        private bool EsDocenteDelCurso(UsuarioRespuesta actual, int cursoId) => actual.Rol == "docente" &&
            Convert.ToInt32(SqlData.Scalar("SELECT COUNT(*) FROM dbo.Curso WHERE Id=@CursoId AND DocenteId=@DocenteId", SqlData.Param("@CursoId", SqlDbType.Int, cursoId), SqlData.Param("@DocenteId", SqlDbType.Int, actual.Id))) > 0;

        private static (decimal? promedio, decimal? asistencia) MetricasEstudiante(int cursoId, int estudianteId)
        {
            var row = SqlData.Query("SELECT (SELECT SUM(g.Nota*e.Peso)/NULLIF(SUM(CASE WHEN g.Nota IS NOT NULL THEN e.Peso END),0) FROM dbo.Evaluacion e LEFT JOIN dbo.Calificacion g ON g.EvaluacionId=e.Id AND g.EstudianteId=@EstudianteId WHERE e.CursoId=@CursoId) AS promedio,(SELECT 100.0*SUM(CASE WHEN a.Presente=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0) FROM dbo.Asistencia a WHERE a.CursoId=@CursoId AND a.EstudianteId=@EstudianteId) AS asistencia",
                SqlData.Param("@EstudianteId", SqlDbType.Int, estudianteId), SqlData.Param("@CursoId", SqlDbType.Int, cursoId)).FirstOrDefault();
            return (DecimalNullable(row["promedio"]), DecimalNullable(row["asistencia"]));
        }

        private static decimal? DecimalNullable(object value) => value == null || value == DBNull.Value ? (decimal?)null : Convert.ToDecimal(value);

        private static string NivelRiesgo(decimal? promedio, decimal? asistencia)
        {
            if (!promedio.HasValue && !asistencia.HasValue) return "sin-datos";
            if ((promedio.HasValue && promedio.Value < 70) || (asistencia.HasValue && asistencia.Value < 75)) return "alto";
            if ((promedio.HasValue && promedio.Value < 80) || (asistencia.HasValue && asistencia.Value < 85)) return "moderado";
            return "bajo";
        }

        private string ValidarEvaluacion(EvaluacionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Nombre) || request.Peso < 1 || request.Peso > 100 ||
                !new[] { "tarea", "proyecto", "examen" }.Contains(request.Tipo) || request.Fecha == default(DateTime))
                return "Revisa el nombre, tipo, peso y fecha de la evaluación.";
            if (request.RequiereEntrega && (string.IsNullOrWhiteSpace(request.Extensiones) || request.MaxMb < 1 || request.MaxMb > 25))
                return "Indica extensiones permitidas y un tamaño entre 1 y 25 MB.";
            if (request.RequiereEntrega && request.Extensiones.Split(',').Select(x => x.Trim().TrimStart('.')).Any(x => !ExtensionesGlobales.Contains(x)))
                return "La evaluación incluye extensiones no permitidas por el sistema.";
            return null;
        }

        private async Task<ArchivoSubido> LeerArchivo()
        {
            if (!Request.Content.IsMimeMultipartContent()) return new ArchivoSubido { Error = "Envía el archivo en formato multipart/form-data." };
            var temporal = Path.Combine(DirectorioArchivos, "tmp");
            Directory.CreateDirectory(temporal);
            var provider = new MultipartFormDataStreamProvider(temporal);
            await Request.Content.ReadAsMultipartAsync(provider);
            var file = provider.FileData.FirstOrDefault();
            if (file == null) return new ArchivoSubido { Error = "Selecciona un archivo." };
            var nombre = Path.GetFileName((file.Headers.ContentDisposition.FileName ?? "").Trim('"'));
            var extension = Path.GetExtension(nombre).TrimStart('.');
            var info = new FileInfo(file.LocalFileName);
            if (info.Length == 0 || !ExtensionesGlobales.Contains(extension))
            {
                BorrarArchivoTemporal(file.LocalFileName);
                return new ArchivoSubido { Error = "El archivo está vacío o su tipo no está permitido." };
            }
            if (info.Length > 25L * 1024L * 1024L)
            {
                BorrarArchivoTemporal(file.LocalFileName);
                return new ArchivoSubido { Error = "El archivo supera el máximo de 25 MB." };
            }
            return new ArchivoSubido
            {
                Temporal = file.LocalFileName,
                Nombre = nombre,
                Extension = extension,
                Tamano = info.Length,
                Formulario = provider.FormData
            };
        }

        private static string GuardarArchivo(string temporal)
        {
            var ruta = Guid.NewGuid().ToString("N") + Path.GetExtension(temporal).ToLowerInvariant();
            File.Move(temporal, ResolverRuta(ruta));
            return ruta;
        }

        private IHttpActionResult Descargar(string ruta, string nombre)
        {
            var path = ResolverRuta(ruta);
            if (!File.Exists(path)) return Error(HttpStatusCode.NotFound, "El archivo ya no está disponible.");
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StreamContent(new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
            };
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
            {
                FileName = "\"" + Path.GetFileName(nombre).Replace("\"", "") + "\""
            };
            return ResponseMessage(response);
        }

        private static string ResolverRuta(string ruta)
        {
            var nombre = Path.GetFileName(ruta ?? "");
            if (string.IsNullOrWhiteSpace(nombre) || nombre != ruta) throw new InvalidOperationException("Ruta de archivo inválida.");
            var path = Path.GetFullPath(Path.Combine(DirectorioArchivos, nombre));
            if (!path.StartsWith(DirectorioArchivos, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Ruta de archivo inválida.");
            return path;
        }

        internal static void EliminarArchivoPrivado(string ruta) => EliminarArchivo(ruta);

        private static void EliminarArchivo(string ruta)
        {
            try
            {
                var path = ResolverRuta(ruta);
                if (File.Exists(path)) File.Delete(path);
            }
            catch (InvalidOperationException) { }
        }

        private static void BorrarArchivoTemporal(string path)
        {
            try { if (!string.IsNullOrWhiteSpace(path) && File.Exists(path)) File.Delete(path); }
            catch (IOException) { }
        }

        private class ArchivoSubido
        {
            public string Error { get; set; }
            public string Temporal { get; set; }
            public string Nombre { get; set; }
            public string Extension { get; set; }
            public long Tamano { get; set; }
            public NameValueCollection Formulario { get; set; }
        }

        private static System.Data.SqlClient.SqlParameter[] ParamEvaluacion(int cursoId, EvaluacionRequest request) => new[]
        {
            SqlData.Param("@CursoId", SqlDbType.Int, cursoId), SqlData.Param("@Nombre", SqlDbType.NVarChar, request.Nombre.Trim(), 120),
            SqlData.Param("@Tipo", SqlDbType.VarChar, request.Tipo, 20), SqlData.Param("@Peso", SqlDbType.Decimal, request.Peso),
            SqlData.Param("@Fecha", SqlDbType.Date, request.Fecha.Date), SqlData.Param("@Instrucciones", SqlDbType.NVarChar, request.Instrucciones, 2000),
            SqlData.Param("@RequiereEntrega", SqlDbType.Bit, request.RequiereEntrega), SqlData.Param("@Extensiones", SqlDbType.NVarChar, request.Extensiones, 200),
            SqlData.Param("@MaxMb", SqlDbType.TinyInt, request.MaxMb), SqlData.Param("@PermiteTardia", SqlDbType.Bit, request.PermiteTardia)
        };
    }
}