using ApiCQRS.Models;
using ApiCQRS.Services.Dtos;
using ApiCQRS.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ApiCQRS.Controllers
{
    /// <summary>
    /// Operaciones de negocio sobre divisiones.
    /// El CRUD básico está en <see cref="DivisionController"/>.
    /// </summary>
    [ApiController]
    [Route("api/division")]
    public class DivisionOperacionesController : ControllerBase
    {
        private readonly IDivisionService _divisionService;

        public DivisionOperacionesController(IDivisionService divisionService)
        {
            _divisionService = divisionService;
        }

        /// <summary>
        /// Marca la división como pagada (saldar la deuda del participante).
        /// </summary>
        /// <response code="200">División actualizada.</response>
        /// <response code="400">Datos inválidos o la división ya estaba pagada.</response>
        /// <response code="404">La división no existe.</response>
        [HttpPost("{idDivision:int}/pagar")]
        [ProducesResponseType(typeof(Division), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Division>> Pagar(
            int idDivision,
            [FromBody] RegistrarPagoDivisionRequest request)
        {
            var division = await _divisionService.RegistrarPagoAsync(idDivision, request);

            return Ok(division);
        }
    }
}
