using ApiCQRS.Models;
using System.Threading.Tasks;

namespace ApiCQRS.Repository.Interfaces
{
    public interface IUcuentaRepository
    {
        Task<Cuenta> Add(Cuenta cuenta);

        Task<Cuenta> Update(Cuenta cuenta);

        Task Delete(int id);
    }
}