namespace ApiCQRS.Models.DTOs
{
    public class SaldoUsuarioResponse
    {
        public int IdUsuario { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public bool EsPagador { get; set; }

        public decimal MontoAsignado { get; set; }

        public decimal MontoAdelantado { get; set; }

        public decimal Saldo { get; set; }

        public string TipoMovimiento { get; set; } = string.Empty;
    }
}