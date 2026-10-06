using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Implements
{
    public class CuentaQueries : ICuentaQueries
    {
        private readonly IDbConnection _db;

        public CuentaQueries(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        public async Task<IEnumerable<Cuenta>> GetAll()
        {
            const string sql = @"
                SELECT
                    id_cuenta AS IdCuenta,
                    id_usuario_pagador AS IdUsuarioPagador,
                    descripcion AS Descripcion,
                    monto_total AS MontoTotal,
                    fecha AS Fecha
                FROM dbo.Cuenta;
            ";

            return await _db.QueryAsync<Cuenta>(sql);
        }

        public async Task<Cuenta?> Get(int id)
        {
            const string sql = @"
                SELECT
                    id_cuenta AS IdCuenta,
                    id_usuario_pagador AS IdUsuarioPagador,
                    descripcion AS Descripcion,
                    monto_total AS MontoTotal,
                    fecha AS Fecha
                FROM dbo.Cuenta
                WHERE id_cuenta = @IdCuenta;
            ";

            return await _db.QueryFirstOrDefaultAsync<Cuenta>(
                sql,
                new { IdCuenta = id }
            );
        }

        public async Task<IEnumerable<Cuenta>> GetPorUsuarioPagador(int idUsuario)
        {
            const string sql = @"
                SELECT
                    id_cuenta AS IdCuenta,
                    id_usuario_pagador AS IdUsuarioPagador,
                    descripcion AS Descripcion,
                    monto_total AS MontoTotal,
                    fecha AS Fecha
                FROM dbo.Cuenta
                WHERE id_usuario_pagador = @IdUsuario
                ORDER BY fecha DESC;
            ";

            return await _db.QueryAsync<Cuenta>(
                sql,
                new { IdUsuario = idUsuario }
            );
        }
    }
}