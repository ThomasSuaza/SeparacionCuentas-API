using ApiCQRS.Models;
using System.Collections.Generic;

namespace ApiCQRS.Services.Dtos
{
    /// <summary>
    /// Cuenta registrada con sus divisiones.
    /// </summary>
    public class CuentaDetalleResponse
    {
        public Cuenta Cuenta { get; set; } = new Cuenta();

        public List<Division> Divisiones { get; set; } = new List<Division>();
    }
}
