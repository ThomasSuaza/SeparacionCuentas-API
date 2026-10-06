using ApiCQRS.Query.Dtos;
using ApiCQRS.Query.Interfaces;
using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Implements
{
    public class BalanceQueries : IBalanceQueries
    {
        private readonly IDbConnection _db;

        public BalanceQueries(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        /// <summary>
        /// Saldo por usuario de una cuenta: participantes de Division más el pagador.
        /// Cuenta inexistente: lista vacía. Cuenta sin divisiones: solo el pagador con Porcentaje 0.
        /// </summary>
        public async Task<IEnumerable<BalanceCuentaUsuario>> GetBalanceCuenta(int idCuenta)
        {
            const string sql = @"
                SELECT
                    u.id_usuario AS IdUsuario,
                    u.nombre AS Nombre,
                    CAST(CASE WHEN u.id_usuario = c.id_usuario_pagador THEN 1 ELSE 0 END AS bit) AS EsPagador,
                    p.pagado AS TotalPagado,
                    ISNULL(d.monto, 0) AS TotalCorrespondiente,
                    p.pagado - ISNULL(d.monto, 0) AS Saldo,
                    CAST(CASE WHEN t.total > 0 THEN ISNULL(d.monto, 0) * 100 / t.total ELSE 0 END AS decimal(9, 4)) AS Porcentaje,
                    d.estado AS Estado
                FROM dbo.Cuenta c
                JOIN dbo.Usuario u
                    ON u.id_usuario = c.id_usuario_pagador
                    OR u.id_usuario IN (SELECT id_usuario FROM dbo.Division WHERE id_cuenta = c.id_cuenta)
                LEFT JOIN dbo.Division d
                    ON d.id_cuenta = c.id_cuenta AND d.id_usuario = u.id_usuario
                CROSS APPLY (
                    SELECT SUM(monto) AS total FROM dbo.Division WHERE id_cuenta = c.id_cuenta
                ) t
                CROSS APPLY (
                    SELECT CASE WHEN u.id_usuario = c.id_usuario_pagador THEN c.monto_total ELSE 0 END AS pagado
                ) p
                WHERE c.id_cuenta = @IdCuenta
                ORDER BY u.nombre;
            ";

            return await _db.QueryAsync<BalanceCuentaUsuario>(
                sql,
                new { IdCuenta = idCuenta }
            );
        }
    }
}
