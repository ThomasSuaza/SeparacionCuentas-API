using ApiCQRS.Models;
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
                    telefono AS Telefono,
                    rol AS Rol,
                    activo AS Activo,
                    fecha_registro AS FechaRegistro
                FROM dbo.Usuario
                WHERE rol <> 'ADMIN'
                ORDER BY id_usuario;";

            return await _db.QueryAsync<UsuarioResponse>(sql);
        }

        public async Task<UsuarioResponse?> Get(int id)
        {
            const string sql = @"
                SELECT
                    id_usuario AS IdUsuario,
                    nombre AS Nombre,
                    correo AS Correo,
                    telefono AS Telefono,
                    rol AS Rol,
                    activo AS Activo,
                    fecha_registro AS FechaRegistro
                FROM dbo.Usuario
                WHERE id_usuario = @IdUsuario;";

            return await _db.QueryFirstOrDefaultAsync<UsuarioResponse>(
                sql,
                new { IdUsuario = id }
            );
        }

        public async Task<Usuario?> GetByCorreo(string correo)
        {
            const string sql = @"
                SELECT
                    id_usuario AS IdUsuario,
                    nombre AS Nombre,
                    correo AS Correo,
                    password_hash AS PasswordHash,
                    telefono AS Telefono,
                    rol AS Rol,
                    activo AS Activo,
                    fecha_registro AS FechaRegistro
                FROM dbo.Usuario
                WHERE LOWER(LTRIM(RTRIM(correo))) = LOWER(LTRIM(RTRIM(@Correo)));";

            return await _db.QueryFirstOrDefaultAsync<Usuario>(
                sql,
                new { Correo = correo }
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
                    u.telefono AS Telefono,
                    u.rol AS Rol,
                    u.activo AS Activo,
                    u.fecha_registro AS FechaRegistro
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