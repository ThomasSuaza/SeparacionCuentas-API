using ApiCQRS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Interfaces
{
    public interface ICuentaQueries
    {
        Task<IEnumerable<Cuenta>> GetAll();
        Task<Cuenta?> Get(int id);
    }
}