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
    }
}