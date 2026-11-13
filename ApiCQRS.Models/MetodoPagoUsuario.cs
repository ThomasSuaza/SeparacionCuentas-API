using Dapper.Contrib.Extensions;
using System;

namespace ApiCQRS.Models
{
    /// <summary>
    /// Medio de cobro o cuenta registrada por un usuario para recibir devoluciones.
    /// </summary>
    [Table("MetodoPagoUsuario")]
    public class MetodoPagoUsuario
    {
        /// <summary>Identificador único del método de pago.</summary>
        [Key]
        public int IdMetodo { get; set; }

        /// <summary>Identificador del usuario titular.</summary>
        public int IdUsuario { get; set; }

        /// <summary>Entidad bancaria o billetera digital.</summary>
        public string Entidad { get; set; } = string.Empty;

        /// <summary>Número de cuenta o celular asociado.</summary>
        public string NumeroCuenta { get; set; } = string.Empty;

        /// <summary>Nombre completo del titular.</summary>
        public string Titular { get; set; } = string.Empty;

        /// <summary>Indica si es el medio de cobro principal.</summary>
        public bool EsPrincipal { get; set; }

        /// <summary>Fecha de registro del medio de cobro.</summary>
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    }
}
