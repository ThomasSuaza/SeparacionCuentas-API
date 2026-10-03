using ApiCQRS.Models;
using ApiCQRS.Repository.Interfaces;
using Dapper;
using System;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Repository.Implements
{
    public class DivisionRepositoriory : IUdivisionRepositoriory
    {
        private readonly IDbConnection _db;

        public DivisionRepositoriory(IDbConnection db)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
        }

        public async Task<Division> Add(Division division)
        {
            const string sql = @"
                INSERT INTO dbo.Division
                (
                    id_cuenta,
                    id_usuario,
                    monto,
                    estado,
                    tipo_pago,
                    referencia_pago,
                    fecha_pago
                )
                VALUES
                (
                    @IdCuenta,
                    @IdUsuario,
                    @Monto,
                    @Estado,
                    @TipoPago,
                    @ReferenciaPago,
                    @FechaPago
                );

                SELECT CAST(SCOPE_IDENTITY() AS INT);
            ";

            division.IdDivision =
                await _db.ExecuteScalarAsync<int>(sql, division);

            return division;
        }

        public async Task<Division> Update(Division division)
        {
            const string sql = @"
                UPDATE dbo.Division
                SET
                    id_cuenta = @IdCuenta,
                    id_usuario = @IdUsuario,
                    monto = @Monto,
                    estado = @Estado,
                    tipo_pago = @TipoPago,
                    referencia_pago = @ReferenciaPago,
                    fecha_pago = @FechaPago
                WHERE id_division = @IdDivision;
            ";

            await _db.ExecuteAsync(sql, division);

            return division;
        }

        public async Task Delete(int id)
        {
            const string sql = @"
                DELETE FROM dbo.Division
                WHERE id_division = @IdDivision;
            ";

            await _db.ExecuteAsync(
                sql,
                new
                {
                    IdDivision = id
                }
            );
        }
    }
}