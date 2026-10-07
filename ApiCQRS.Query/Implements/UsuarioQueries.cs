using ApiCQRS.Models.DTOs;
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

        public async Task<IEnumerable<UsuarioResponse>> GetAll()
        {
            const string sql = @"
                SELECT
                    id_usuario AS IdUsuario,
                    nombre AS Nombre,
                    correo AS Correo,
                    telefono AS Telefono
                FROM dbo.Usuario;";

            return await _db.QueryAsync<UsuarioResponse>(sql);
        }

        public async Task<UsuarioResponse?> Get(int id)
        {
            const string sql = @"
                SELECT
                    id_usuario AS IdUsuario,
                    nombre AS Nombre,
                    correo AS Correo,
                    telefono AS Telefono
                FROM dbo.Usuario
                WHERE id_usuario = @IdUsuario;";

            return await _db.QueryFirstOrDefaultAsync<UsuarioResponse>(
                sql,
                new { IdUsuario = id }
            );
        }

        public async Task<IEnumerable<UsuarioResponse>> GetParticipantesCuenta(
            int idCuenta)
        {
            const string sql = @"
                SELECT
                    u.id_usuario AS IdUsuario,
                    u.nombre AS Nombre,
                    u.correo AS Correo,
                    u.telefono AS Telefono
                FROM dbo.Usuario u
                INNER JOIN dbo.Division d
                    ON d.id_usuario = u.id_usuario
                WHERE d.id_cuenta = @IdCuenta;";

            return await _db.QueryAsync<UsuarioResponse>(
                sql,
                new { IdCuenta = idCuenta }
            );
        }
    }
}