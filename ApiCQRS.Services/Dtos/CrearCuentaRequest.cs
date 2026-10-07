using System;
using System.Collections.Generic;

namespace ApiCQRS.Services.Dtos
{
    /// <summary>
    /// Datos para registrar una cuenta junto con la división entre participantes.
    /// </summary>
    public class CrearCuentaRequest
    {
        /// <summary>Usuario que pagó la cuenta.</summary>
        public int IdUsuarioPagador { get; set; }

        /// <summary>Descripción de la cuenta (máximo 200 caracteres).</summary>
        public string Descripcion { get; set; } = string.Empty;

        /// <summary>Valor total de la cuenta (mayor que cero, máximo 2 decimales).</summary>
        public decimal MontoTotal { get; set; }

        /// <summary>Fecha de la cuenta. Si no se envía se usa la fecha actual.</summary>
        public DateTime? Fecha { get; set; }

        /// <summary>
        /// Participantes. Si ninguno trae Monto, el total se divide en partes iguales.
        /// Si todos traen Monto, la suma debe ser igual a MontoTotal.
        /// </summary>
        public List<ParticipanteCuentaRequest> Participantes { get; set; } = new List<ParticipanteCuentaRequest>();
    }

    /// <summary>
    /// Participante de una cuenta.
    /// </summary>
    public class ParticipanteCuentaRequest
    {
        /// <summary>Identificador del usuario participante.</summary>
        public int IdUsuario { get; set; }

        /// <summary>Monto que le corresponde. Opcional (null = parte igual).</summary>
        public decimal? Monto { get; set; }
    }
}
