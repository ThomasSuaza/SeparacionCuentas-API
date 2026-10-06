using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Implements
{
    public class UsuarioQueries : IUsuarioQueries
    {
        private readonly IDbConnection _db;

        public UsuarioQueries(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        public async Task<IEnumerable<Usuario>> GetAll()
        {
            const string sql = @"
                SELECT
                    id_usuario AS IdUsuario,
                    nombre AS Nombre,
                    correo AS Correo,
                    password_hash AS PasswordHash,
                    telefono AS Telefono
                FROM dbo.Usuario;
            ";

            return await _db.QueryAsync<Usuario>(sql);
        }

        public async Task<Usuario?> Get(int id)
        {
            const string sql = @"
                SELECT
                    id_usuario AS IdUsuario,
                    nombre AS Nombre,
                    correo AS Correo,
                    password_hash AS PasswordHash,
                    telefono AS Telefono
                FROM dbo.Usuario
                WHERE id_usuario = @IdUsuario;
            ";

            return await _db.QueryFirstOrDefaultAsync<Usuario>(
                sql,
                new { IdUsuario = id }
            );
        }

        /// <summary>
        /// Usuarios que tienen una división en la cuenta. No devuelve password_hash.
        /// </summary>
        public async Task<IEnumerable<Usuario>> GetParticipantesCuenta(int idCuenta)
        {
            const string sql = @"
                SELECT
                    u.id_usuario AS IdUsuario,
                    u.nombre AS Nombre,
                    u.correo AS Correo,
                    u.telefono AS Telefono
                FROM dbo.Usuario u
                JOIN dbo.Division d ON d.id_usuario = u.id_usuario
                WHERE d.id_cuenta = @IdCuenta;
            ";

            return await _db.QueryAsync<Usuario>(
                sql,
                new { IdCuenta = idCuenta }
            );
        }
    }
}