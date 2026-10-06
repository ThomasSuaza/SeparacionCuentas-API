using ApiCQRS.Services.Dtos;
using ApiCQRS.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ApiCQRS.Controllers
{
    /// <summary>
    /// Operaciones de negocio sobre cuentas: registro con división y balance.
    /// El CRUD básico de cuentas está en <see cref="CuentaController"/>.
    /// </summary>
    [ApiController]
    [Route("api/cuenta")]
    public class CuentaOperacionesController : ControllerBase
    {
        private readonly ICuentaService _cuentaService;
        private readonly IBalanceService _balanceService;

        public CuentaOperacionesController(
            ICuentaService cuentaService,
            IBalanceService balanceService)
        {
            _cuentaService = cuentaService;
            _balanceService = balanceService;
        }

        /// <summary>
        /// Registra una cuenta y divide su valor entre los participantes.
        /// </summary>
        /// <remarks>
        /// Si ningún participante trae "monto", el valor se divide en partes iguales.
        /// </remarks>
        /// <response code="201">Cuenta y divisiones creadas.</response>
        /// <response code="400">Datos inválidos.</response>
        /// <response code="404">Algún usuario no existe.</response>
        [HttpPost("registrar")]
        [ProducesResponseType(typeof(CuentaDetalleResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CuentaDetalleResponse>> Registrar(
            [FromBody] CrearCuentaRequest request)
        {
            var resultado = await _cuentaService.RegistrarCuentaAsync(request);

            return CreatedAtAction(
                nameof(CuentaController.Get),
                "Cuenta",
                new { id = resultado.Cuenta.IdCuenta },
                resultado);
        }

        /// <summary>
        /// Resumen de saldos de una cuenta. Opcionalmente reparte una propina
        /// proporcionalmente a lo que le corresponde a cada participante.
        /// </summary>
        /// <param name="idCuenta">Identificador de la cuenta.</param>
        /// <param name="propina">Propina a repartir (opcional, por defecto 0).</param>
        /// <response code="200">Balance de la cuenta.</response>
        /// <response code="400">Propina inválida.</response>
        /// <response code="404">La cuenta no existe.</response>
        [HttpGet("{idCuenta:int}/balance")]
        [ProducesResponseType(typeof(BalanceCuentaResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<BalanceCuentaResponse>> GetBalance(
            int idCuenta,
            [FromQuery] decimal propina = 0m)
        {
            var balance = await _balanceService.ObtenerBalanceAsync(idCuenta, propina);

            return Ok(balance);
        }
    }
}
