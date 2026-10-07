using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ApiCQRS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DivisionController : ControllerBase
    {
        private readonly IDivisionQueries _query;
        private readonly IUdivisionRepositoriory _repo;
        private readonly ILogger<DivisionController> _logger;

        public DivisionController(
            IDivisionQueries query,
            IUdivisionRepositoriory repo,
            ILogger<DivisionController> logger)
        {
            _query = query;
            _repo = repo;
            _logger = logger;
        }


        /// <summary>
        /// Obtiene todas las divisiones registradas.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Division>>> GetAll()
        {
            try
            {
                var divisiones = await _query.GetAll();

                return Ok(divisiones);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo las divisiones"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Obtiene una división por su ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Division>> Get(int id)
        {
            try
            {
                var division = await _query.Get(id);

                if (division == null)
                {
                    return NotFound(
                        $"No se encontró la división con ID {id}."
                    );
                }

                return Ok(division);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo la división {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Obtiene todas las divisiones asociadas a una cuenta.
        /// </summary>
        [HttpGet("cuenta/{idCuenta}")]
        public async Task<ActionResult<IEnumerable<Division>>> GetPorCuenta(
            int idCuenta)
        {
            try
            {
                var divisiones = await _query.GetPorCuenta(idCuenta);

                return Ok(divisiones);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo las divisiones de la cuenta {IdCuenta}",
                    idCuenta
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Obtiene todas las divisiones asociadas a un usuario.
        /// </summary>
        [HttpGet("usuario/{idUsuario}")]
        public async Task<ActionResult<IEnumerable<Division>>> GetPorUsuario(
            int idUsuario)
        {
            try
            {
                var divisiones = await _query.GetPorUsuario(idUsuario);

                return Ok(divisiones);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo las divisiones del usuario {IdUsuario}",
                    idUsuario
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Crea una nueva división.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Division>> Create(
            [FromBody] Division division)
        {
            try
            {
                var resultado = await _repo.Add(division);

                return StatusCode(
                    StatusCodes.Status201Created,
                    resultado
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error creando una división"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Actualiza una división existente.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Division>> Update(
            int id,
            [FromBody] Division division)
        {
            try
            {
                if (id != division.IdDivision)
                {
                    return BadRequest(
                        "El ID de la URL no coincide con el ID de la división."
                    );
                }

                var existente = await _query.Get(id);

                if (existente == null)
                {
                    return NotFound(
                        $"No se encontró la división con ID {id}."
                    );
                }

                var resultado = await _repo.Update(division);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error actualizando la división {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Elimina una división existente.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var existente = await _query.Get(id);

                if (existente == null)
                {
                    return NotFound(
                        $"No se encontró la división con ID {id}."
                    );
                }

                await _repo.Delete(id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error eliminando la división {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }
    }
}