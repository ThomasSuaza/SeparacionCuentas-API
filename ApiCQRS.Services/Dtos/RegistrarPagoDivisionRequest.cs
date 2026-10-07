namespace ApiCQRS.Services.Dtos
{
    /// <summary>
    /// Datos para marcar una división como pagada.
    /// </summary>
    public class RegistrarPagoDivisionRequest
    {
        /// <summary>Método de pago (por ejemplo EFECTIVO, TRANSFERENCIA). Máximo 30 caracteres.</summary>
        public string TipoPago { get; set; } = string.Empty;

        /// <summary>Referencia del pago (opcional). Máximo 100 caracteres.</summary>
        public string? ReferenciaPago { get; set; }
    }
}
