using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ApiCQRS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioQueries _query;
        private readonly IUsuarioRepository _repo;
        private readonly ILogger<UsuarioController> _logger;

        public UsuarioController(
            IUsuarioQueries query,
            IUsuarioRepository repo,
            ILogger<UsuarioController> logger)
        {
            _query = query;
            _repo = repo;
            _logger = logger;
        }


        /// <summary>
        /// Obtiene todos los usuarios registrados.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetAll()
        {
            try
            {
                var usuarios = await _query.GetAll();

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo los usuarios"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Obtiene un usuario por su ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Usuario>> Get(int id)
        {
            try
            {
                var usuario = await _query.Get(id);

                if (usuario == null)
                {
                    return NotFound(
                        $"No se encontró el usuario con ID {id}."
                    );
                }

                return Ok(usuario);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo el usuario {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Obtiene los usuarios participantes de una cuenta.
        /// </summary>
        [HttpGet("cuenta/{idCuenta}/participantes")]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetParticipantesCuenta(
            int idCuenta)
        {
            try
            {
                var usuarios = await _query.GetParticipantesCuenta(idCuenta);

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo los participantes de la cuenta {IdCuenta}",
                    idCuenta
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Crea un nuevo usuario.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Usuario>> Create(
            [FromBody] Usuario usuario)
        {
            try
            {
                var resultado = await _repo.Add(usuario);

                return StatusCode(
                    StatusCodes.Status201Created,
                    resultado
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error creando un usuario"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Actualiza un usuario existente.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Usuario>> Update(
            int id,
            [FromBody] Usuario usuario)
        {
            try
            {
                if (id != usuario.IdUsuario)
                {
                    return BadRequest(
                        "El ID de la URL no coincide con el ID del usuario."
                    );
                }

                var existente = await _query.Get(id);

                if (existente == null)
                {
                    return NotFound(
                        $"No se encontró el usuario con ID {id}."
                    );
                }

                var resultado = await _repo.Update(usuario);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error actualizando el usuario {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Elimina un usuario existente.
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
                        $"No se encontró el usuario con ID {id}."
                    );
                }

                await _repo.Delete(id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error eliminando el usuario {Id}",
                    id
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }
    }
}