using ApiCQRS.Services.Dtos;
using System.Threading.Tasks;

namespace ApiCQRS.Services.Interfaces
{
    public interface IBalanceService
    {
        /// <summary>
        /// Resumen de saldos de una cuenta, con reparto opcional de propina.
        /// </summary>
        Task<BalanceCuentaResponse> ObtenerBalanceAsync(int idCuenta, decimal propina = 0m);
    }
}
