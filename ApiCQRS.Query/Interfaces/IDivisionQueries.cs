using ApiCQRS.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Interfaces
{
    public interface IDivisionQueries
    {
        Task<IEnumerable<Division>> GetAll();
        Task<Division?> Get(int id);
    }
}