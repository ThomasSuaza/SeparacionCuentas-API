using ApiCQRS.Query.Interfaces;
using ApiCQRS.Services.Dtos;
using ApiCQRS.Services.Exceptions;
using ApiCQRS.Services.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ApiCQRS.Services.Implements
{
    /// <summary>
    /// Convierte los datos de IBalanceQueries en un resumen listo para la API.
    /// </summary>
    public class BalanceService : IBalanceService
    {
        private readonly ICuentaQueries _cuentaQueries;
        private readonly IBalanceQueries _balanceQueries;

        public BalanceService(ICuentaQueries cuentaQueries, IBalanceQueries balanceQueries)
        {
            _cuentaQueries = cuentaQueries ?? throw new ArgumentNullException(nameof(cuentaQueries));
            _balanceQueries = balanceQueries ?? throw new ArgumentNullException(nameof(balanceQueries));
        }

        public async Task<BalanceCuentaResponse> ObtenerBalanceAsync(int idCuenta, decimal propina = 0m)
        {
            if (propina < 0)
                throw new ReglaNegocioException("La propina no puede ser negativa.");

            if (decimal.Round(propina, 2) != propina)
                throw new ReglaNegocioException("La propina admite máximo 2 decimales.");

            var cuenta = await _cuentaQueries.Get(idCuenta);
            if (cuenta == null)
                throw new RecursoNoEncontradoException($"La cuenta {idCuenta} no existe.");

            var filas = (await _balanceQueries.GetBalanceCuenta(idCuenta)).ToList();
            var propinas = RepartirPropina(propina, filas.Select(f => f.TotalCorrespondiente).ToList());

            return new BalanceCuentaResponse
            {
                IdCuenta = cuenta.IdCuenta,
                Descripcion = cuenta.Descripcion,
                Fecha = cuenta.Fecha,
                MontoTotal = cuenta.MontoTotal,
                Propina = propina,
                Participantes = filas.Select((f, i) => new BalanceParticipanteResponse
                {
                    IdUsuario = f.IdUsuario,
                    Nombre = f.Nombre,
                    EsPagador = f.EsPagador,
                    TotalPagado = f.TotalPagado,
                    TotalCorrespondiente = f.TotalCorrespondiente,
                    Saldo = f.Saldo,
                    Situacion = f.Saldo > 0 ? "LE_DEBEN" : f.Saldo < 0 ? "DEBE" : "AL_DIA",
                    Porcentaje = f.Porcentaje,
                    PropinaCorrespondiente = propinas[i],
                    TotalConPropina = f.TotalCorrespondiente + propinas[i],
                    Estado = f.Estado
                }).ToList()
            };
        }

        /// <summary>
        /// Reparte la propina proporcionalmente al monto de cada división.
        /// Los centavos sobrantes van a quienes tienen mayor monto, para que la suma sea exacta.
        /// </summary>
        private static decimal[] RepartirPropina(decimal propina, System.Collections.Generic.List<decimal> montos)
        {
            var resultado = new decimal[montos.Count];
            if (propina == 0m)
                return resultado;

            var totalDivisiones = montos.Sum();
            if (totalDivisiones <= 0)
                throw new ReglaNegocioException("La cuenta no tiene divisiones sobre las cuales repartir la propina.");

            decimal asignado = 0m;
            for (var i = 0; i < montos.Count; i++)
            {
                resultado[i] = decimal.Floor(propina * montos[i] / totalDivisiones * 100m) / 100m;
                asignado += resultado[i];
            }

            var centavos = (int)Math.Round((propina - asignado) * 100m);
            var orden = Enumerable.Range(0, montos.Count)
                .OrderByDescending(i => montos[i])
                .ToList();

            for (var k = 0; k < centavos; k++)
                resultado[orden[k % orden.Count]] += 0.01m;

            return resultado;
        }
    }
}
