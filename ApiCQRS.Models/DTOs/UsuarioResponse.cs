namespace ApiCQRS.Models.DTOs
{
    public class UsuarioResponse
    {
        public int IdUsuario { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string Correo { get; set; } = string.Empty;

        public string? Telefono { get; set; }
    }
}