using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Interfaces;
using ApiCQRS.Services.Dtos;
using ApiCQRS.Services.Exceptions;
using ApiCQRS.Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace ApiCQRS.Services.Implements
{
    /// <summary>
    /// Reglas para saldar la parte de cada participante.
    /// </summary>
    public class DivisionService : IDivisionService
    {
        private const int MaxTipoPago = 30;
        private const int MaxReferencia = 100;

        private readonly IDivisionQueries _divisionQueries;
        private readonly IUdivisionRepositoriory _divisionRepository;

        public DivisionService(
            IDivisionQueries divisionQueries,
            IUdivisionRepositoriory divisionRepository)
        {
            _divisionQueries = divisionQueries ?? throw new ArgumentNullException(nameof(divisionQueries));
            _divisionRepository = divisionRepository ?? throw new ArgumentNullException(nameof(divisionRepository));
        }

        public async Task<Division> RegistrarPagoAsync(int idDivision, RegistrarPagoDivisionRequest request)
        {
            if (request == null)
                throw new ReglaNegocioException("La solicitud es obligatoria.");

            if (string.IsNullOrWhiteSpace(request.TipoPago))
                throw new ReglaNegocioException("El tipo de pago es obligatorio.");

            if (request.TipoPago.Trim().Length > MaxTipoPago)
                throw new ReglaNegocioException($"El tipo de pago no puede superar {MaxTipoPago} caracteres.");

            if (request.ReferenciaPago != null && request.ReferenciaPago.Trim().Length > MaxReferencia)
                throw new ReglaNegocioException($"La referencia no puede superar {MaxReferencia} caracteres.");

            var division = await _divisionQueries.Get(idDivision);
            if (division == null)
                throw new RecursoNoEncontradoException($"La división {idDivision} no existe.");

            if (string.Equals(division.Estado, EstadosDivision.Pagado, StringComparison.OrdinalIgnoreCase))
                throw new ReglaNegocioException("La división ya está pagada.");

            division.Estado = EstadosDivision.Pagado;
            division.TipoPago = request.TipoPago.Trim();
            division.ReferenciaPago = string.IsNullOrWhiteSpace(request.ReferenciaPago)
                ? null
                : request.ReferenciaPago.Trim();
            division.FechaPago = DateTime.Now;

            return await _divisionRepository.Update(division);
        }
    }
}
