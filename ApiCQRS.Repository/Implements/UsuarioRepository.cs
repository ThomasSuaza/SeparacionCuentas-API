using ApiCQRS.Models;
using ApiCQRS.Repository.Interfaces;
using Dapper;
using System;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Repository.Implements
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly IDbConnection _db;

        public UsuarioRepository(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        public async Task<Usuario> Add(Usuario usuario)
        {
            const string sql = @"
                INSERT INTO dbo.Usuario
                (
                    nombre,
                    correo,
                    password_hash,
                    telefono
                )
                VALUES
                (
                    @Nombre,
                    @Correo,
                    @PasswordHash,
                    @Telefono
                );

                SELECT CAST(SCOPE_IDENTITY() AS INT);
            ";

            usuario.IdUsuario =
                await _db.ExecuteScalarAsync<int>(sql, usuario);

            return usuario;
        }

        public async Task<Usuario> Update(Usuario usuario)
        {
            const string sql = @"
                UPDATE dbo.Usuario
                SET
                    nombre = @Nombre,
                    correo = @Correo,
                    password_hash = @PasswordHash,
                    telefono = @Telefono
                WHERE id_usuario = @IdUsuario;
            ";

            await _db.ExecuteAsync(sql, usuario);

            return usuario;
        }

        public async Task Delete(int id)
        {
            const string sql = @"
                DELETE FROM dbo.Usuario
                WHERE id_usuario = @IdUsuario;
            ";

            await _db.ExecuteAsync(
                sql,
                new
                {
                    IdUsuario = id
                }
            );
        }
    }
}