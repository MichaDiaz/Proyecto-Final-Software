using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HomeClassApi.Models
{
    public class LoginRequest
    {
        [Required]
        public string Correo { get; set; }

        [Required]
        public string Clave { get; set; }
    }

    public class CambioClaveRequest
    {
        [Required]
        public string Actual { get; set; }

        [Required]
        public string Nueva { get; set; }
    }

    public class UsuarioRespuesta
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Correo { get; set; }
        public string Rol { get; set; }
        public bool Activo { get; set; }
    }

    public class UsuarioSeed
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Correo { get; set; }
        public string ClaveHash { get; set; }
        public string Rol { get; set; }
        public bool Activo { get; set; }
    }

    public class CursoSeed
    {
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Periodo { get; set; }
        public string Descripcion { get; set; }
        public int? DocenteId { get; set; }
    }

    public class RespuestaError
    {
        public string Mensaje { get; set; }
    }
}
