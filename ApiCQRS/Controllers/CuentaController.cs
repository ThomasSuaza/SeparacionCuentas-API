using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Implements;
using ApiCQRS.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ApiCQRS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CuentaController : ControllerBase
    {
        private readonly ICuentaQueries _query;
        private readonly IUcuentaRepository _repo;
        private readonly ILogger<CuentaController> _logger;

        public CuentaController(
            ICuentaQueries query,
            IUcuentaRepository repo,
            ILogger<CuentaController> logger)
        {
            _query = query;
            _repo = repo;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todas las cuentas.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cuenta>>> GetAll()
        {
            try
            {
                var cuentas = await _query.GetAll();

                return Ok(cuentas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo las cuentas");

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }

        /// <summary>
        /// Obtiene una cuenta por su ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Cuenta>> Get(int id)
        {
            try
            {
                var cuenta = await _query.Get(id);

                if (cuenta == null)
                {
                    return NotFound();
                }

                return Ok(cuenta);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo la cuenta {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }

        /// <summary>
        /// Crea una nueva cuenta.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Cuenta>> Create(
            [FromBody] Cuenta cuenta)
        {
            try
            {
                var resultado = await _repo.Add(cuenta);

                return StatusCode(
                    StatusCodes.Status201Created,
                    resultado
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando una cuenta");

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }

        /// <summary>
        /// Actualiza una cuenta existente.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Cuenta>> Update(
            int id,
            [FromBody] Cuenta cuenta)
        {
            try
            {
                if (id != cuenta.IdCuenta)
                {
                    return BadRequest(
                        "El ID de la URL no coincide con el ID de la cuenta."
                    );
                }

                var existente = await _query.Get(id);

                if (existente == null)
                {
                    return NotFound();
                }

                var resultado = await _repo.Update(cuenta);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error actualizando la cuenta {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }

        /// <summary>
        /// Elimina una cuenta por su ID.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var existente = await _query.Get(id);

                if (existente == null)
                {
                    return NotFound();
                }

                await _repo.Delete(id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error eliminando la cuenta {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }
    }
}