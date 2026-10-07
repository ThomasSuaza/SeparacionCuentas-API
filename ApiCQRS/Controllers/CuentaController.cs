using ApiCQRS.Models;
using ApiCQRS.Models.DTOs;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
        /// Obtiene todas las cuentas registradas.
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
                _logger.LogError(
                    ex,
                    "Error obteniendo las cuentas"
                );

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
                    return NotFound(
                        $"No se encontró la cuenta con ID {id}."
                    );
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
        /// Obtiene todas las cuentas pagadas por un usuario.
        /// </summary>
        [HttpGet("usuario/{idUsuario}")]
        public async Task<ActionResult<IEnumerable<Cuenta>>> GetPorUsuarioPagador(
            int idUsuario)
        {
            try
            {
                var cuentas = await _query.GetPorUsuarioPagador(idUsuario);

                return Ok(cuentas);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo las cuentas del usuario {IdUsuario}",
                    idUsuario
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError
                );
            }
        }


        /// <summary>
        /// Obtiene los saldos, devoluciones y estado de distribución de una cuenta.
        /// </summary>
        [HttpGet("{idCuenta}/devoluciones")]
        public async Task<ActionResult<ResumenDevolucionCuentaResponse>> GetDevoluciones(
            int idCuenta)
        {
            try
            {
                var cuenta = await _query.Get(idCuenta);

                if (cuenta == null)
                {
                    return NotFound(
                        $"No se encontró la cuenta con ID {idCuenta}."
                    );
                }

                var saldos = (
                    await _query.GetDevoluciones(idCuenta)
                ).ToList();

                var totalDivisiones = saldos.Sum(
                    x => x.MontoAsignado
                );

                string estadoDistribucion;

                if (totalDivisiones == cuenta.MontoTotal)
                {
                    estadoDistribucion = "COMPLETA";
                }
                else if (totalDivisiones < cuenta.MontoTotal)
                {
                    estadoDistribucion = "PENDIENTE";
                }
                else
                {
                    estadoDistribucion = "EXCEDIDA";
                }

                var diferencia = Math.Abs(
                    cuenta.MontoTotal - totalDivisiones
                );

                var response = new ResumenDevolucionCuentaResponse
                {
                    IdCuenta = cuenta.IdCuenta,
                    MontoTotalCuenta = cuenta.MontoTotal,
                    TotalDivisiones = totalDivisiones,
                    Diferencia = diferencia,
                    EstadoDistribucion = estadoDistribucion,
                    Saldos = saldos
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error obteniendo las devoluciones de la cuenta {IdCuenta}",
                    idCuenta
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
                _logger.LogError(
                    ex,
                    "Error creando una cuenta"
                );

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
                    return NotFound(
                        $"No se encontró la cuenta con ID {id}."
                    );
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
        /// Elimina una cuenta existente.
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
                        $"No se encontró la cuenta con ID {id}."
                    );
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