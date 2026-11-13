using System;

namespace ApiCQRS.Models.DTOs
{
    public class UsuarioResponse
    {
        public int IdUsuario { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string Correo { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        public string Rol { get; set; } = "USUARIO";

        public bool Activo { get; set; } = true;

        public DateTime FechaRegistro { get; set; }
    }
}