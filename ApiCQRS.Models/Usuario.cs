using Dapper.Contrib.Extensions;
using System;

/// <summary>
/// Modelo de datos para la entidad Usuario.
/// </summary>
namespace ApiCQRS.Models
{
    /// <summary>
    /// Modelo de datos para la entidad Usuario.
    /// </summary>
    public class Usuario
    {
        /// <summary>
        /// Identificador único del usuario.
        /// </summary>
        public int IdUsuario { get; set; }

        /// <summary>
        /// Nombre del usuario.
        /// </summary>
        public string Nombre { get; set; } = string.Empty;

        /// <summary>
        /// Correo electrónico del usuario.
        /// </summary>
        public string Correo { get; set; } = string.Empty;

        /// <summary>
        /// Hash de la contraseña del usuario.
        /// </summary>
        public string PasswordHash { get; set; } = string.Empty;

        /// <summary>
        /// Número telefónico del usuario.
        /// </summary>
        public string? Telefono { get; set; }

        /// <summary>
        /// Rol del usuario en SplitIA (USUARIO o ADMIN).
        /// </summary>
        public string Rol { get; set; } = "USUARIO";

        /// <summary>
        /// Indica si la cuenta de usuario está activa.
        /// </summary>
        public bool Activo { get; set; } = true;

        /// <summary>
        /// Fecha de registro del usuario.
        /// </summary>
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    }
}