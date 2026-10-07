using ApiCQRS.Models;
using ApiCQRS.Services.Dtos;
using System.Threading.Tasks;

namespace ApiCQRS.Services.Interfaces
{
    public interface IDivisionService
    {
        /// <summary>
        /// Marca una división como pagada.
        /// </summary>
        Task<Division> RegistrarPagoAsync(int idDivision, RegistrarPagoDivisionRequest request);
    }
}
