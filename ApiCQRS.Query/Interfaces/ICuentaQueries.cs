using ApiCQRS.Models;
using ApiCQRS.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Interfaces
{
    public interface ICuentaQueries
    {
        Task<IEnumerable<Cuenta>> GetAll();

        Task<Cuenta?> Get(int id);

        Task<IEnumerable<Cuenta>> GetPorUsuarioPagador(int idUsuario);

        Task<IEnumerable<SaldoUsuarioResponse>> GetDevoluciones(
            int idCuenta
        );
    }
}