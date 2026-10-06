using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Interfaces;
using ApiCQRS.Services.Dtos;
using ApiCQRS.Services.Exceptions;
using ApiCQRS.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ApiCQRS.Services.Implements
{
    /// <summary>
    /// Registra una cuenta y reparte su valor entre los participantes.
    /// Único punto donde se implementa la regla de división.
    /// </summary>
    public class CuentaService : ICuentaService
    {
        private const int MaxDescripcion = 200;

        private readonly IUsuarioQueries _usuarioQueries;
        private readonly IUcuentaRepository _cuentaRepository;
        private readonly IUdivisionRepositoriory _divisionRepository;

        public CuentaService(
            IUsuarioQueries usuarioQueries,
            IUcuentaRepository cuentaRepository,
            IUdivisionRepositoriory divisionRepository)
        {
            _usuarioQueries = usuarioQueries ?? throw new ArgumentNullException(nameof(usuarioQueries));
            _cuentaRepository = cuentaRepository ?? throw new ArgumentNullException(nameof(cuentaRepository));
            _divisionRepository = divisionRepository ?? throw new ArgumentNullException(nameof(divisionRepository));
        }

        public async Task<CuentaDetalleResponse> RegistrarCuentaAsync(CrearCuentaRequest request)
        {
            ValidarSolicitud(request);
            await ValidarUsuariosAsync(request);

            var montos = CalcularMontos(request);
            var fecha = request.Fecha ?? DateTime.Now;

            var cuenta = await _cuentaRepository.Add(new Cuenta
            {
                IdUsuarioPagador = request.IdUsuarioPagador,
                Descripcion = request.Descripcion.Trim(),
                MontoTotal = request.MontoTotal,
                Fecha = fecha
            });

            // Los repositorios no exponen transacciones: si falla alguna división,
            // se borra lo ya creado para no dejar una cuenta a medias.
            var divisiones = new List<Division>();
            try
            {
                foreach (var (idUsuario, monto) in montos)
                {
                    var esPagador = idUsuario == request.IdUsuarioPagador;

                    var division = await _divisionRepository.Add(new Division
                    {
                        IdCuenta = cuenta.IdCuenta,
                        IdUsuario = idUsuario,
                        Monto = monto,
                        // El pagador ya puso el dinero: su parte nace pagada.
                        Estado = esPagador ? EstadosDivision.Pagado : EstadosDivision.Pendiente,
                        FechaPago = esPagador ? (DateTime?)fecha : null
                    });

                    divisiones.Add(division);
                }
            }
            catch
            {
                await DeshacerAsync(cuenta, divisiones);
                throw;
            }

            return new CuentaDetalleResponse
            {
                Cuenta = cuenta,
                Divisiones = divisiones
            };
        }

        private static void ValidarSolicitud(CrearCuentaRequest request)
        {
            if (request == null)
                throw new ReglaNegocioException("La solicitud es obligatoria.");

            if (request.IdUsuarioPagador <= 0)
                throw new ReglaNegocioException("Debe indicar el usuario que pagó la cuenta.");

            if (string.IsNullOrWhiteSpace(request.Descripcion))
                throw new ReglaNegocioException("La descripción es obligatoria.");

            if (request.Descripcion.Trim().Length > MaxDescripcion)
                throw new ReglaNegocioException($"La descripción no puede superar {MaxDescripcion} caracteres.");

            if (request.MontoTotal <= 0)
                throw new ReglaNegocioException("El valor de la cuenta debe ser mayor que cero.");

            if (decimal.Round(request.MontoTotal, 2) != request.MontoTotal)
                throw new ReglaNegocioException("El valor de la cuenta admite máximo 2 decimales.");

            if (request.Participantes == null || request.Participantes.Count == 0)
                throw new ReglaNegocioException("Debe haber al menos un participante.");

            if (request.Participantes.Any(p => p == null))
                throw new ReglaNegocioException("La lista de participantes contiene elementos vacíos.");

            if (request.Participantes.GroupBy(p => p.IdUsuario).Any(g => g.Count() > 1))
                throw new ReglaNegocioException("Un usuario no puede aparecer dos veces como participante.");
        }

        private async Task ValidarUsuariosAsync(CrearCuentaRequest request)
        {
            var ids = request.Participantes
                .Select(p => p.IdUsuario)
                .Concat(new[] { request.IdUsuarioPagador })
                .Distinct();

            // Secuencial a propósito: todas las consultas comparten una sola conexión.
            foreach (var id in ids)
            {
                var usuario = await _usuarioQueries.Get(id);
                if (usuario == null)
                    throw new RecursoNoEncontradoException($"El usuario {id} no existe.");
            }
        }

        /// <summary>
        /// Devuelve (usuario, monto) para cada participante.
        /// Sin montos: partes iguales. Con montos para todos: deben sumar el total.
        /// </summary>
        private static List<(int IdUsuario, decimal Monto)> CalcularMontos(CrearCuentaRequest request)
        {
            var participantes = request.Participantes;
            var conMonto = participantes.Count(p => p.Monto.HasValue);

            if (conMonto == 0)
                return DividirEnPartesIguales(request.MontoTotal, participantes);

            if (conMonto != participantes.Count)
                throw new ReglaNegocioException(
                    "Indique el monto de todos los participantes o de ninguno (partes iguales).");

            foreach (var p in participantes)
            {
                var monto = p.Monto!.Value;

                if (monto <= 0)
                    throw new ReglaNegocioException($"El monto del usuario {p.IdUsuario} debe ser mayor que cero.");

                if (decimal.Round(monto, 2) != monto)
                    throw new ReglaNegocioException($"El monto del usuario {p.IdUsuario} admite máximo 2 decimales.");
            }

            var suma = participantes.Sum(p => p.Monto!.Value);
            if (suma != request.MontoTotal)
                throw new ReglaNegocioException(
                    $"La suma de los montos ({suma}) debe ser igual al valor de la cuenta ({request.MontoTotal}).");

            return participantes.Select(p => (p.IdUsuario, p.Monto!.Value)).ToList();
        }

        /// <summary>
        /// Divide en partes iguales a 2 decimales. Los centavos sobrantes se reparten de a uno
        /// para que la suma de las partes sea exactamente el total.
        /// </summary>
        private static List<(int IdUsuario, decimal Monto)> DividirEnPartesIguales(
            decimal total, List<ParticipanteCuentaRequest> participantes)
        {
            var n = participantes.Count;
            var parteBase = decimal.Floor(total * 100m / n) / 100m;
            var centavosSobrantes = (int)Math.Round((total - parteBase * n) * 100m);

            var resultado = new List<(int IdUsuario, decimal Monto)>();
            for (var i = 0; i < n; i++)
            {
                var monto = parteBase + (i < centavosSobrantes ? 0.01m : 0m);
                resultado.Add((participantes[i].IdUsuario, monto));
            }

            return resultado;
        }

        private async Task DeshacerAsync(Cuenta cuenta, List<Division> divisiones)
        {
            try
            {
                foreach (var division in divisiones)
                    await _divisionRepository.Delete(division.IdDivision);

                await _cuentaRepository.Delete(cuenta.IdCuenta);
            }
            catch
            {
                // Mejor esfuerzo: se prioriza propagar el error original que causó el fallo.
            }
        }
    }
}
