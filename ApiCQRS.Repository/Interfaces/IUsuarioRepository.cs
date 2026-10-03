using ApiCQRS.Models;
using System.Threading.Tasks;

namespace ApiCQRS.Repository.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<Usuario> Add(Usuario usuario);

        Task<Usuario> Update(Usuario usuario);

        Task Delete(int id);
    }
}