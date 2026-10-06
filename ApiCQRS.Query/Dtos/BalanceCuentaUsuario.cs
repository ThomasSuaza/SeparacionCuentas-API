namespace ApiCQRS.Query.Dtos
{
    /// <summary>
    /// Saldo de un usuario dentro de una cuenta.
    /// </summary>
    public class BalanceCuentaUsuario
    {
        /// <summary>
        /// Identificador del usuario.
        /// </summary>
        public int IdUsuario { get; set; }

        /// <summary>
        /// Nombre del usuario.
        /// </summary>
        public string Nombre { get; set; } = string.Empty;

        /// <summary>
        /// Indica si el usuario fue quien pagó la cuenta.
        /// </summary>
        public bool EsPagador { get; set; }

        /// <summary>
        /// Valor que pagó el usuario (monto total si es el pagador, 0 en otro caso).
        /// </summary>
        public decimal TotalPagado { get; set; }

        /// <summary>
        /// Valor que le corresponde según su división.
        /// </summary>
        public decimal TotalCorrespondiente { get; set; }

        /// <summary>
        /// TotalPagado - TotalCorrespondiente. Positivo: le deben; negativo: debe.
        /// </summary>
        public decimal Saldo { get; set; }

        /// <summary>
        /// Porcentaje (0-100) que representa su división sobre la suma de divisiones de la cuenta.
        /// Sirve para repartir la propina de forma proporcional.
        /// </summary>
        public decimal Porcentaje { get; set; }

        /// <summary>
        /// Estado de la división del usuario (null si no tiene división en la cuenta).
        /// </summary>
        public string? Estado { get; set; }
    }
}
