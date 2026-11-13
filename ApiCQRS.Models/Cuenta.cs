using Dapper.Contrib.Extensions;
using System;

namespace ApiCQRS.Models
{
    /// <summary>
    /// Modelo de datos para la entidad Cuenta.
    /// </summary>
    [Table("Cuenta")]
    public class Cuenta
    {
        /// <summary>
        /// Identificador único de la cuenta.
        /// </summary>
        [Key]
        public int IdCuenta { get; set; }

        /// <summary>
        /// Usuario que realizó el pago de la cuenta.
        /// </summary>
        public int IdUsuarioPagador { get; set; }

        /// <summary>
        /// Descripción de la cuenta.
        /// </summary>
        public string Descripcion { get; set; } = string.Empty;

        /// <summary>
        /// Valor total de la cuenta.
        /// </summary>
        public decimal MontoTotal { get; set; }

        /// <summary>
        /// Fecha de la cuenta.
        /// </summary>
        public DateTime Fecha { get; set; }

        /// <summary>
        /// Categoría del gasto compartido.
        /// </summary>
        public string Categoria { get; set; } = "General";

        /// <summary>
        /// Estado operativo de la cuenta (ACTIVA, CERRADA, ANULADA).
        /// </summary>
        public string Estado { get; set; } = "ACTIVA";

        /// <summary>
        /// Notas o detalle adicional de la cuenta.
        /// </summary>
        public string? Notas { get; set; }
    }
}