using System;
using System.Linq;
using System.Security.Cryptography;
using System.Data;
using System.Text;
using HomeClassApi.Models;

namespace HomeClassApi.Services
{
    public static class AuthService
    {
        public static UsuarioSeed BuscarPorCorreo(string correo)
        {
            var row = SqlData.Query(
                "SELECT Id, Nombre, Correo, ClaveHash, Rol, Activo FROM dbo.Usuario WHERE Correo = @Correo",
                SqlData.Param("@Correo", SqlDbType.NVarChar, correo, 254)).FirstOrDefault();
            return row == null ? null : new UsuarioSeed
            {
                Id = (int)row["Id"],
                Nombre = (string)row["Nombre"],
                Correo = (string)row["Correo"],
                ClaveHash = (string)row["ClaveHash"],
                Rol = (string)row["Rol"],
                Activo = (bool)row["Activo"]
            };
        }

        public static UsuarioRespuesta ValidarLogin(string correo, string clave)
        {
            var usuario = BuscarPorCorreo(correo);
            if (usuario == null || !usuario.Activo)
            {
                return null;
            }

            if (!VerificarClave(clave, usuario.ClaveHash))
            {
                return null;
            }

            if (!usuario.ClaveHash.StartsWith("pbkdf2-sha256$", StringComparison.Ordinal))
            {
                SqlData.Execute("UPDATE dbo.Usuario SET ClaveHash=@Hash WHERE Id=@Id",
                    SqlData.Param("@Hash", SqlDbType.VarChar, Hash(clave), 120),
                    SqlData.Param("@Id", SqlDbType.Int, usuario.Id));
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
            var row = SqlData.Query(
                "SELECT Id, Nombre, Correo, Rol, Activo FROM dbo.Usuario WHERE Id = @Id",
                SqlData.Param("@Id", SqlDbType.Int, id)).FirstOrDefault();
            return row == null ? null : MapUsuario(row);
        }

        public static List<UsuarioRespuesta> ObtenerUsuarios()
        {
            return SqlData.Query("SELECT Id, Nombre, Correo, Rol, Activo FROM dbo.Usuario ORDER BY Nombre")
                .Select(MapUsuario).ToList();
        }

        public static IEnumerable<object> ObtenerCursos(string rol, int usuarioId)
        {
            var filtro = rol == "docente"
                ? "WHERE c.DocenteId = @UsuarioId"
                : rol == "estudiante"
                    ? "INNER JOIN dbo.Inscripcion i ON i.CursoId = c.Id AND i.EstudianteId = @UsuarioId"
                    : string.Empty;
            var sql = "SELECT c.Id AS id, c.Codigo AS codigo, c.Nombre AS nombre, c.Periodo AS periodo, " +
                "c.Descripcion AS descripcion, c.DocenteId AS docenteId, COALESCE(d.Nombre, N'Sin docente') AS docente, " +
                "(SELECT COUNT(*) FROM dbo.Inscripcion i2 WHERE i2.CursoId = c.Id) AS estudiantes, " +
                "CASE WHEN @Rol = 'estudiante' THEN propio.promedio ELSE resumen.promedio END AS promedio, " +
                "CASE WHEN @Rol = 'estudiante' THEN propio.asistencia ELSE resumen.asistencia END AS asistencia, " +
                "CASE WHEN @Rol = 'estudiante' THEN CASE WHEN propio.promedio < 70 OR propio.asistencia < 75 THEN 1 ELSE 0 END ELSE COALESCE(resumen.enRiesgo,0) END AS enRiesgo, " +
                "propio.promedioGrupo AS promedioGrupo, CASE WHEN propio.promedio IS NULL AND propio.asistencia IS NULL THEN 'sin-datos' WHEN propio.promedio < 70 OR propio.asistencia < 75 THEN 'alto' WHEN propio.promedio < 80 OR propio.asistencia < 85 THEN 'moderado' ELSE 'bajo' END AS riesgo " +
                "FROM dbo.Curso c LEFT JOIN dbo.Usuario d ON d.Id = c.DocenteId " + filtro +
                " OUTER APPLY (SELECT AVG(CAST(m.promedio AS FLOAT)) AS promedio, AVG(CAST(m.asistencia AS FLOAT)) AS asistencia, SUM(CASE WHEN m.promedio < 70 OR m.asistencia < 75 THEN 1 ELSE 0 END) AS enRiesgo FROM dbo.Inscripcion i " +
                "OUTER APPLY (SELECT (SELECT SUM(g.Nota*e.Peso)/NULLIF(SUM(CASE WHEN g.Nota IS NOT NULL THEN e.Peso END),0) FROM dbo.Evaluacion e LEFT JOIN dbo.Calificacion g ON g.EvaluacionId=e.Id AND g.EstudianteId=i.EstudianteId WHERE e.CursoId=c.Id) AS promedio, " +
                "(SELECT 100.0*SUM(CASE WHEN a.Presente=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0) FROM dbo.Asistencia a WHERE a.CursoId=c.Id AND a.EstudianteId=i.EstudianteId) AS asistencia) m WHERE i.CursoId=c.Id) resumen " +
                "OUTER APPLY (SELECT (SELECT SUM(g.Nota*e.Peso)/NULLIF(SUM(CASE WHEN g.Nota IS NOT NULL THEN e.Peso END),0) FROM dbo.Evaluacion e LEFT JOIN dbo.Calificacion g ON g.EvaluacionId=e.Id AND g.EstudianteId=@UsuarioId WHERE e.CursoId=c.Id) AS promedio, " +
                "(SELECT 100.0*SUM(CASE WHEN a.Presente=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0) FROM dbo.Asistencia a WHERE a.CursoId=c.Id AND a.EstudianteId=@UsuarioId) AS asistencia, " +
                "(SELECT AVG(CAST(p.promedio AS FLOAT)) FROM dbo.Inscripcion i OUTER APPLY (SELECT SUM(g.Nota*e.Peso)/NULLIF(SUM(CASE WHEN g.Nota IS NOT NULL THEN e.Peso END),0) AS promedio FROM dbo.Evaluacion e LEFT JOIN dbo.Calificacion g ON g.EvaluacionId=e.Id AND g.EstudianteId=i.EstudianteId WHERE e.CursoId=c.Id) p WHERE i.CursoId=c.Id) AS promedioGrupo) propio " +
                "ORDER BY c.Nombre";
            return SqlData.Query(sql, SqlData.Param("@Rol", SqlDbType.VarChar, rol, 20), SqlData.Param("@UsuarioId", SqlDbType.Int, usuarioId));
        }

        private static UsuarioRespuesta MapUsuario(System.Collections.Generic.Dictionary<string, object> row)
        {
            return new UsuarioRespuesta
            {
                Id = (int)row["Id"],
                Nombre = (string)row["Nombre"],
                Correo = (string)row["Correo"],
                Rol = (string)row["Rol"],
                Activo = (bool)row["Activo"]
            };
        }

        public static string Hash(string value)
        {
            const int iteraciones = 120000;
            var sal = new byte[16];
            using (var generador = RandomNumberGenerator.Create()) generador.GetBytes(sal);
            using (var pbkdf2 = new Rfc2898DeriveBytes(value ?? string.Empty, sal, iteraciones, HashAlgorithmName.SHA256))
            {
                var clave = pbkdf2.GetBytes(32);
                return "pbkdf2-sha256$" + iteraciones + "$" + Convert.ToBase64String(sal) + "$" + Convert.ToBase64String(clave);
            }
        }

        public static bool VerificarClave(string value, string almacenada)
        {
            if (string.IsNullOrEmpty(almacenada)) return false;
            var partes = almacenada.Split('$');
            if (partes.Length == 4 && partes[0] == "pbkdf2-sha256")
            {
                try
                {
                    var iteraciones = int.Parse(partes[1]);
                    var sal = Convert.FromBase64String(partes[2]);
                    var esperada = Convert.FromBase64String(partes[3]);
                    using (var pbkdf2 = new Rfc2898DeriveBytes(value ?? string.Empty, sal, iteraciones, HashAlgorithmName.SHA256))
                    {
                        var calculada = pbkdf2.GetBytes(esperada.Length);
                        var diferencia = calculada.Length ^ esperada.Length;
                        for (var i = 0; i < calculada.Length && i < esperada.Length; i++) diferencia |= calculada[i] ^ esperada[i];
                        return diferencia == 0;
                    }
                }
                catch (FormatException) { return false; }
                catch (ArgumentException) { return false; }
            }

            return string.Equals(almacenada, HashLegado(value), StringComparison.OrdinalIgnoreCase);
        }

        private static string HashLegado(string value)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(value ?? string.Empty);
                var hash = sha256.ComputeHash(bytes);
                return string.Concat(hash.Select(b => b.ToString("x2")));
            }
        }
    }
}
