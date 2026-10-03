using ApiCQRS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Interfaces
{
    public interface IUsuarioQueries
    {
        Task<IEnumerable<Usuario>> GetAll();
        Task<Usuario?> Get(int id);
    }
}