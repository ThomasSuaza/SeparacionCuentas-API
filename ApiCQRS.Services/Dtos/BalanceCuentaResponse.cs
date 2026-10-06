using System;
using System.Collections.Generic;

namespace ApiCQRS.Services.Dtos
{
    /// <summary>
    /// Resumen de saldos de una cuenta.
    /// </summary>
    public class BalanceCuentaResponse
    {
        public int IdCuenta { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public decimal MontoTotal { get; set; }

        /// <summary>Propina enviada para repartir (0 si no hay).</summary>
        public decimal Propina { get; set; }

        public List<BalanceParticipanteResponse> Participantes { get; set; } = new List<BalanceParticipanteResponse>();
    }

    /// <summary>
    /// Saldo de un participante dentro de la cuenta.
    /// </summary>
    public class BalanceParticipanteResponse
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public bool EsPagador { get; set; }
        public decimal TotalPagado { get; set; }
        public decimal TotalCorrespondiente { get; set; }

        /// <summary>TotalPagado - TotalCorrespondiente. Positivo: le deben; negativo: debe.</summary>
        public decimal Saldo { get; set; }

        /// <summary>LE_DEBEN, DEBE o AL_DIA.</summary>
        public string Situacion { get; set; } = string.Empty;

        public decimal Porcentaje { get; set; }

        /// <summary>Parte de la propina repartida proporcionalmente a su división.</summary>
        public decimal PropinaCorrespondiente { get; set; }

        /// <summary>TotalCorrespondiente + PropinaCorrespondiente.</summary>
        public decimal TotalConPropina { get; set; }

        public string? Estado { get; set; }
    }
}
