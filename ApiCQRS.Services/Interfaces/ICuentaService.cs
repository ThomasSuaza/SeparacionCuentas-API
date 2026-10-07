using ApiCQRS.Services.Dtos;
using System.Threading.Tasks;

namespace ApiCQRS.Services.Interfaces
{
    public interface ICuentaService
    {
        /// <summary>
        /// Registra una cuenta y divide su valor entre los participantes.
        /// </summary>
        Task<CuentaDetalleResponse> RegistrarCuentaAsync(CrearCuentaRequest request);
    }
}
