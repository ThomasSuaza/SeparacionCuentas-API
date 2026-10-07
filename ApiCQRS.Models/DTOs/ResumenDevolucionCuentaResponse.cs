using System.Collections.Generic;

namespace ApiCQRS.Models.DTOs
{
    public class ResumenDevolucionCuentaResponse
    {
        public int IdCuenta { get; set; }

        public decimal MontoTotalCuenta { get; set; }

        public decimal TotalDivisiones { get; set; }

        public decimal Diferencia { get; set; }

        public string EstadoDistribucion { get; set; } = string.Empty;

        public List<SaldoUsuarioResponse> Saldos { get; set; } = new List<SaldoUsuarioResponse>();
            }
}