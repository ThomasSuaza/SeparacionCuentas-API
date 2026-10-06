using ApiCQRS.Query.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Interfaces
{
    public interface IBalanceQueries
    {
        Task<IEnumerable<BalanceCuentaUsuario>> GetBalanceCuenta(int idCuenta);
    }
}
