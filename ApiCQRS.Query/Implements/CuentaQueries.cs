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
                FROM dbo.Cuenta;";

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
                WHERE id_cuenta = @IdCuenta;";

            return await _db.QueryFirstOrDefaultAsync<Cuenta>(
                sql,
                new
                {
                    IdCuenta = id
                }
            );
        }


        public async Task<IEnumerable<Cuenta>> GetPorUsuarioPagador(
            int idUsuario)
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
                ORDER BY fecha DESC;";

            return await _db.QueryAsync<Cuenta>(
                sql,
                new
                {
                    IdUsuario = idUsuario
                }
            );
        }


        public async Task<IEnumerable<SaldoUsuarioResponse>>
            GetDevoluciones(int idCuenta)
        {
            const string sql = @"
                WITH CuentaSeleccionada AS
                (
                    SELECT
                        id_cuenta,
                        id_usuario_pagador,
                        monto_total
                    FROM dbo.Cuenta
                    WHERE id_cuenta = @IdCuenta
                ),

                PendientePagador AS
                (
                    SELECT
                        COALESCE(
                            SUM(
                                CASE
                                    WHEN d.id_usuario <> c.id_usuario_pagador
                                         AND d.estado = 'PENDIENTE'
                                    THEN d.monto
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS SaldoPendiente
                    FROM CuentaSeleccionada c
                    LEFT JOIN dbo.Division d
                        ON d.id_cuenta = c.id_cuenta
                )

                SELECT
                    u.id_usuario AS IdUsuario,
                    u.nombre AS Nombre,

                    CAST(1 AS BIT) AS EsPagador,

                    COALESCE(dp.monto, 0) AS MontoAsignado,

                    c.monto_total AS MontoAdelantado,

                    p.SaldoPendiente AS Saldo,

                    CASE
                        WHEN p.SaldoPendiente > 0
                            THEN 'RECIBE'
                        ELSE 'SALDADO'
                    END AS TipoMovimiento

                FROM CuentaSeleccionada c

                INNER JOIN dbo.Usuario u
                    ON u.id_usuario = c.id_usuario_pagador

                LEFT JOIN dbo.Division dp
                    ON dp.id_cuenta = c.id_cuenta
                    AND dp.id_usuario = c.id_usuario_pagador

                CROSS JOIN PendientePagador p


                UNION ALL


                SELECT
                    u.id_usuario AS IdUsuario,
                    u.nombre AS Nombre,

                    CAST(0 AS BIT) AS EsPagador,

                    d.monto AS MontoAsignado,

                    CAST(0 AS DECIMAL(12,2)) AS MontoAdelantado,

                    CASE
                        WHEN d.estado = 'PAGADO'
                            THEN 0
                        ELSE d.monto
                    END AS Saldo,

                    CASE
                        WHEN d.estado = 'PAGADO'
                            THEN 'SALDADO'
                        ELSE 'PAGA'
                    END AS TipoMovimiento

                FROM CuentaSeleccionada c

                INNER JOIN dbo.Division d
                    ON d.id_cuenta = c.id_cuenta

                INNER JOIN dbo.Usuario u
                    ON u.id_usuario = d.id_usuario

                WHERE d.id_usuario <> c.id_usuario_pagador;";

            return await _db.QueryAsync<SaldoUsuarioResponse>(
    sql,
    new
    {
        IdCuenta = idCuenta
    }
);
        }
    }
}