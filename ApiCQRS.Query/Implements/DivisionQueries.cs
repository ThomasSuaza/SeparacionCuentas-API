using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Query.Implements
{
    public class DivisionQueries : IDivisionQueries
    {
        private readonly IDbConnection _db;

        public DivisionQueries(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        public async Task<IEnumerable<Division>> GetAll()
        {
            const string sql = @"
                SELECT
                    id_division AS IdDivision,
                    id_cuenta AS IdCuenta,
                    id_usuario AS IdUsuario,
                    monto AS Monto,
                    estado AS Estado,
                    tipo_pago AS TipoPago,
                    referencia_pago AS ReferenciaPago,
                    fecha_pago AS FechaPago
                FROM dbo.Division;
            ";

            return await _db.QueryAsync<Division>(sql);
        }

        public async Task<Division?> Get(int id)
        {
            const string sql = @"
                SELECT
                    id_division AS IdDivision,
                    id_cuenta AS IdCuenta,
                    id_usuario AS IdUsuario,
                    monto AS Monto,
                    estado AS Estado,
                    tipo_pago AS TipoPago,
                    referencia_pago AS ReferenciaPago,
                    fecha_pago AS FechaPago
                FROM dbo.Division
                WHERE id_division = @IdDivision;
            ";

            return await _db.QueryFirstOrDefaultAsync<Division>(
                sql,
                new { IdDivision = id }
            );
        }

        public async Task<IEnumerable<Division>> GetPorCuenta(int idCuenta)
        {
            const string sql = @"
                SELECT
                    id_division AS IdDivision,
                    id_cuenta AS IdCuenta,
                    id_usuario AS IdUsuario,
                    monto AS Monto,
                    estado AS Estado,
                    tipo_pago AS TipoPago,
                    referencia_pago AS ReferenciaPago,
                    fecha_pago AS FechaPago
                FROM dbo.Division
                WHERE id_cuenta = @IdCuenta;
            ";

            return await _db.QueryAsync<Division>(
                sql,
                new { IdCuenta = idCuenta }
            );
        }

        public async Task<IEnumerable<Division>> GetPorUsuario(int idUsuario)
        {
            const string sql = @"
                SELECT
                    id_division AS IdDivision,
                    id_cuenta AS IdCuenta,
                    id_usuario AS IdUsuario,
                    monto AS Monto,
                    estado AS Estado,
                    tipo_pago AS TipoPago,
                    referencia_pago AS ReferenciaPago,
                    fecha_pago AS FechaPago
                FROM dbo.Division
                WHERE id_usuario = @IdUsuario;
            ";

            return await _db.QueryAsync<Division>(
                sql,
                new { IdUsuario = idUsuario }
            );
        }
    }
}