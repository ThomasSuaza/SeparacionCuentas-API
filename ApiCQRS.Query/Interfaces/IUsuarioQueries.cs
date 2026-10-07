using ApiCQRS.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Interfaces
{
    public interface IUsuarioQueries
    {
        Task<IEnumerable<UsuarioResponse>> GetAll();

        Task<UsuarioResponse?> Get(int id);

        Task<IEnumerable<UsuarioResponse>> GetParticipantesCuenta(int idCuenta);
    }
}