namespace ApiCQRS.Models.DTOs
{
    /// <summary>
    /// Petición de inicio de sesión contra SplitIA.
    /// </summary>
    public class LoginRequest
    {
        /// <summary>Correo electrónico del usuario o administrador.</summary>
        public string Correo { get; set; } = string.Empty;

        /// <summary>Contraseña en texto plano enviada de forma segura.</summary>
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Respuesta de autenticación de SplitIA.
    /// </summary>
    public class LoginResponse
    {
        /// <summary>Indica si la validación de credenciales fue exitosa.</summary>
        public bool Autenticado { get; set; }

        /// <summary>Mensaje descriptivo del resultado.</summary>
        public string Mensaje { get; set; } = string.Empty;

        /// <summary>Datos del perfil autenticado.</summary>
        public UsuarioResponse? Usuario { get; set; }
    }
}
