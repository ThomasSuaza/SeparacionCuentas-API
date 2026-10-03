using ApiCQRS.Models;
using System.Threading.Tasks;

namespace ApiCQRS.Repository.Interfaces
{
    public interface IUdivisionRepositoriory
    {
        Task<Division> Add(Division division);

        Task<Division> Update(Division division);

        Task Delete(int id);
    }
}