using Dapper.Contrib.Extensions;
using System;

namespace ApiCQRS.Models
{
    /// <summary>
    /// Modelo de datos para la entidad Division.
    /// </summary>
    [Table("Division")]
    public class Division
    {
        /// <summary>
        /// Identificador único de la división.
        /// </summary>
        [Key]
        public int IdDivision { get; set; }

        /// <summary>
        /// Identificador de la cuenta asociada.
        /// </summary>
        public int IdCuenta { get; set; }

        /// <summary>
        /// Identificador del usuario asociado.
        /// </summary>
        public int IdUsuario { get; set; }

        /// <summary>
        /// Monto correspondiente al usuario.
        /// </summary>
        public decimal Monto { get; set; }

        /// <summary>
        /// Estado actual de la división.
        /// </summary>
        public string Estado { get; set; } = "PENDIENTE";

        /// <summary>
        /// Tipo o método de pago utilizado.
        /// </summary>
        public string? TipoPago { get; set; }

        /// <summary>
        /// Referencia del pago realizado.
        /// </summary>
        public string? ReferenciaPago { get; set; }

        /// <summary>
        /// Fecha en la que se realizó el pago.
        /// </summary>
        public DateTime? FechaPago { get; set; }
    }
}