using Dapper.Contrib.Extensions;
using System;

namespace ApiCQRS.Models
{
    /// <summary>
    /// Evento persistido en la bitácora de auditoría del sistema SplitIA.
    /// </summary>
    [Table("AuditoriaEvento")]
    public class AuditoriaEvento
    {
        /// <summary>Identificador único del evento.</summary>
        [Key]
        public int IdEvento { get; set; }

        /// <summary>Identificador del usuario que originó el evento.</summary>
        public int? IdUsuarioActor { get; set; }

        /// <summary>Módulo funcional (Auth, Usuario, Cuenta, Division, Sistema).</summary>
        public string Modulo { get; set; } = string.Empty;

        /// <summary>Método HTTP u operación realizada.</summary>
        public string Metodo { get; set; } = string.Empty;

        /// <summary>Endpoint invocado.</summary>
        public string Endpoint { get; set; } = string.Empty;

        /// <summary>Descripción legible del evento.</summary>
        public string Descripcion { get; set; } = string.Empty;

        /// <summary>Fecha y hora UTC/local del registro.</summary>
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
    }
}
