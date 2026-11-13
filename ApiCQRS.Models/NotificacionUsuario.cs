using Dapper.Contrib.Extensions;
using System;

namespace ApiCQRS.Models
{
    /// <summary>
    /// Notificación o recordatorio financiero del usuario.
    /// </summary>
    [Table("NotificacionUsuario")]
    public class NotificacionUsuario
    {
        /// <summary>Identificador único de la notificación.</summary>
        [Key]
        public int IdNotificacion { get; set; }

        /// <summary>Identificador del usuario destinatario.</summary>
        public int IdUsuario { get; set; }

        /// <summary>Identificador de la cuenta relacionada, si aplica.</summary>
        public int? IdCuenta { get; set; }

        /// <summary>Título breve de la alerta.</summary>
        public string Titulo { get; set; } = string.Empty;

        /// <summary>Contenido del mensaje de notificación.</summary>
        public string Mensaje { get; set; } = string.Empty;

        /// <summary>Indica si el usuario ya leyó la notificación.</summary>
        public bool Leida { get; set; }

        /// <summary>Fecha de creación.</summary>
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    }
}
