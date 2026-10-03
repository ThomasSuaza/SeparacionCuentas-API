using ApiCQRS.Models;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ApiCQRS.Controllers
{
    /// <summary>
    /// Controlador para manejar las operaciones relacionadas con los usuarios.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly ILogger<UsuarioController> _logger;
        private readonly IUsuarioQueries _query;
        private readonly IUsuarioRepository _repo;

        /// <summary>
        /// Inicializa una nueva instancia de la clase <see cref="UsuarioController"/>.
        /// </summary>
        /// <param name="logger">Logger del controlador.</param>
        /// <param name="query">Consultas para acceder a los usuarios.</param>
        /// <param name="repo">Repositorio para modificar los usuarios.</param>
        /// <exception cref="ArgumentNullException"></exception>
        public UsuarioController(ILogger<UsuarioController> logger, IUsuarioQueries query, IUsuarioRepository repo)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _query = query ?? throw new ArgumentNullException(nameof(query));
            _repo = repo ?? throw new ArgumentNullException(nameof(repo)); 
        }

        /// <summary>
        /// Obtiene todos los usuarios.
        /// </summary>
        /// <response code="200">Devuelve una lista de usuarios.</response>
        /// <response code="500">Error interno del servidor.</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<Usuario>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetAll()
        {
            try
            {
                _logger.LogInformation("Consultando todos los usuarios");
                var usuarios = await _query.GetAll();
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error consultando todos los usuarios");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Obtiene un usuario por su ID.
        /// </summary>
        /// <param name="id"></param>
        /// <response code="200">Devuelve el usuario correspondiente al ID proporcionado.</response>
        /// <response code="404">No se encontró un usuario con el ID proporcionado.</response>
        /// <response code="500">Error interno del servidor.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(Usuario), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Usuario>> GetById(int id)
        {
            try
            {
                _logger.LogInformation("Consultando usuario por ID: {Id}", id);
                var usuario = await _query.Get(id);
                if (usuario == null)
                {
                    return NotFound();
                }
                return Ok(usuario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error consultando usuario por ID: {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Crea un nuevo usuario.
        /// </summary>
        /// <param name="usuario"></param>
        /// <response code="201">Usuario creado exitosamente.</response>
        /// <response code="400">Solicitud inválida.</response>
        /// <response code="500">Error interno del servidor.</response>
        [HttpPost]
        [ProducesResponseType(typeof(Usuario), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Usuario>> Create([FromBody] Usuario usuario)
        {
            try
            {
                _logger.LogInformation("Creando un nuevo usuario");
                var rs = await _repo.Add(usuario);
                return StatusCode(StatusCodes.Status201Created, rs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando un nuevo usuario");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        error = ex.Message,
                        detalle = ex.InnerException?.Message
                    }
                );
            }
        }

        /// <summary>
        /// Actualiza un usuario existente.
        /// </summary>
        /// <param name="id"></param>
        /// <param name="usuario"></param>
        /// <response code="200">Usuario actualizado exitosamente.</response>
        /// <response code="400">Solicitud inválida.</response>
        /// <response code="404">No se encontró un usuario con el ID proporcionado.</response>
        /// <response code="500">Error interno del servidor.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(Usuario), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Usuario>> Update(int id, [FromBody] Usuario usuario)
        {
            try
            {
                _logger.LogInformation("Actualizando usuario con ID: {Id}", id);
                if (id != usuario.IdUsuario)
                {
                    return BadRequest();
                }
                var rs = await _repo.Update(usuario);
                if (rs == null)
                {
                    return NotFound();
                }
                return Ok(rs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando usuario con ID: {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Elimina un usuario por su ID.
        /// </summary>
        /// <param name="id"></param>
        /// <response code="204">Usuario eliminado exitosamente.</response>
        /// <response code="500">Error interno del servidor.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                _logger.LogInformation("Eliminando usuario con ID: {Id}", id);
                await _repo.Delete(id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando usuario con ID: {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }
    }
}
