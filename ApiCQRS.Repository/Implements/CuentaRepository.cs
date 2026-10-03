using ApiCQRS.Models;
using ApiCQRS.Repository.Interfaces;
using Dapper;
using System;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Repository.Implements
{
    public class CuentaRepository : IUcuentaRepository
    {
        private readonly IDbConnection _db;

        public CuentaRepository(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        public async Task<Cuenta> Add(Cuenta cuenta)
        {
            const string sql = @"
                INSERT INTO dbo.Cuenta
                (
                    id_usuario_pagador,
                    descripcion,
                    monto_total,
                    fecha
                )
                VALUES
                (
                    @IdUsuarioPagador,
                    @Descripcion,
                    @MontoTotal,
                    @Fecha
                );

                SELECT CAST(SCOPE_IDENTITY() AS INT);
            ";

            cuenta.IdCuenta =
                await _db.ExecuteScalarAsync<int>(sql, cuenta);

            return cuenta;
        }

        public async Task<Cuenta> Update(Cuenta cuenta)
        {
            const string sql = @"
                UPDATE dbo.Cuenta
                SET
                    id_usuario_pagador = @IdUsuarioPagador,
                    descripcion = @Descripcion,
                    monto_total = @MontoTotal,
                    fecha = @Fecha
                WHERE id_cuenta = @IdCuenta;
            ";

            await _db.ExecuteAsync(sql, cuenta);

            return cuenta;
        }

        public async Task Delete(int id)
        {
            const string sql = @"
                DELETE FROM dbo.Cuenta
                WHERE id_cuenta = @IdCuenta;
            ";

            await _db.ExecuteAsync(
                sql,
                new
                {
                    IdCuenta = id
                }
            );
        }
    }
}