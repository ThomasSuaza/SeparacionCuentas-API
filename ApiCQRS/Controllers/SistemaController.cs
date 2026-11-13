using ApiCQRS.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace ApiCQRS.Controllers
{
    /// <summary>
    /// Controlador de vistas analíticas, ítems de consumo, métodos de pago, notificaciones y auditoría en SQL Server.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SistemaController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly ILogger<SistemaController> _logger;

        public SistemaController(IDbConnection db, ILogger<SistemaController> logger)
        {
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene la vista resumida de cuentas desde vw_ResumenCuentas.
        /// </summary>
        [HttpGet("resumen-cuentas")]
        public async Task<IActionResult> GetResumenCuentas()
        {
            try
            {
                const string sql = "SELECT * FROM dbo.vw_ResumenCuentas ORDER BY fecha DESC;";
                var rows = await _db.QueryAsync(sql);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error consultando vw_ResumenCuentas");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Obtiene el resumen de saldos por usuario desde vw_SaldosPorUsuario.
        /// </summary>
        [HttpGet("saldos-usuarios")]
        public async Task<IActionResult> GetSaldosUsuarios()
        {
            try
            {
                const string sql = "SELECT * FROM dbo.vw_SaldosPorUsuario ORDER BY id_usuario;";
                var rows = await _db.QueryAsync(sql);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error consultando vw_SaldosPorUsuario");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Obtiene todos los ítems de consumo registrados en SQL Server.
        /// </summary>
        [HttpGet("items")]
        public async Task<ActionResult<IEnumerable<ItemConsumo>>> GetAllItems()
        {
            try
            {
                const string sql = @"
                    SELECT
                        id_item AS IdItem,
                        id_cuenta AS IdCuenta,
                        concepto AS Concepto,
                        detalle AS Detalle,
                        valor AS Valor,
                        icono AS Icono
                    FROM dbo.ItemConsumo
                    ORDER BY id_item DESC;";
                return Ok(await _db.QueryAsync<ItemConsumo>(sql));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo ítems de consumo");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Registra un nuevo ítem de consumo para una cuenta.
        /// </summary>
        [HttpPost("items")]
        public async Task<ActionResult<ItemConsumo>> CreateItem([FromBody] ItemConsumo item)
        {
            try
            {
                const string sql = @"
                    INSERT INTO dbo.ItemConsumo (id_cuenta, concepto, detalle, valor, icono)
                    VALUES (@IdCuenta, @Concepto, @Detalle, @Valor, @Icono);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                item.Icono = string.IsNullOrWhiteSpace(item.Icono) ? "🧾" : item.Icono;
                item.IdItem = await _db.ExecuteScalarAsync<int>(sql, item);
                return StatusCode(StatusCodes.Status201Created, item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando ítem de consumo");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Obtiene los métodos de pago/cobro registrados por un usuario.
        /// </summary>
        [HttpGet("metodos-pago/{idUsuario}")]
        public async Task<ActionResult<IEnumerable<MetodoPagoUsuario>>> GetMetodosPago(int idUsuario)
        {
            try
            {
                const string sql = @"
                    SELECT
                        id_metodo AS IdMetodo,
                        id_usuario AS IdUsuario,
                        entidad AS Entidad,
                        numero_cuenta AS NumeroCuenta,
                        titular AS Titular,
                        es_principal AS EsPrincipal,
                        fecha_creacion AS FechaCreacion
                    FROM dbo.MetodoPagoUsuario
                    WHERE id_usuario = @IdUsuario
                    ORDER BY es_principal DESC, id_metodo ASC;";
                return Ok(await _db.QueryAsync<MetodoPagoUsuario>(sql, new { IdUsuario = idUsuario }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo métodos de pago");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Registra un nuevo método de pago/cobro para un usuario.
        /// </summary>
        [HttpPost("metodos-pago")]
        public async Task<ActionResult<MetodoPagoUsuario>> AddMetodoPago([FromBody] MetodoPagoUsuario metodo)
        {
            try
            {
                if (metodo.EsPrincipal)
                {
                    await _db.ExecuteAsync(
                        "UPDATE dbo.MetodoPagoUsuario SET es_principal = 0 WHERE id_usuario = @IdUsuario;",
                        new { metodo.IdUsuario });
                }

                const string sql = @"
                    INSERT INTO dbo.MetodoPagoUsuario (id_usuario, entidad, numero_cuenta, titular, es_principal)
                    VALUES (@IdUsuario, @Entidad, @NumeroCuenta, @Titular, @EsPrincipal);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                metodo.IdMetodo = await _db.ExecuteScalarAsync<int>(sql, metodo);
                return StatusCode(StatusCodes.Status201Created, metodo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando método de pago");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Obtiene notificaciones del usuario desde SQL Server.
        /// </summary>
        [HttpGet("notificaciones/{idUsuario}")]
        public async Task<ActionResult<IEnumerable<NotificacionUsuario>>> GetNotificaciones(int idUsuario)
        {
            try
            {
                const string sql = @"
                    SELECT
                        id_notificacion AS IdNotificacion,
                        id_usuario AS IdUsuario,
                        id_cuenta AS IdCuenta,
                        titulo AS Titulo,
                        mensaje AS Mensaje,
                        leida AS Leida,
                        fecha_creacion AS FechaCreacion
                    FROM dbo.NotificacionUsuario
                    WHERE id_usuario = @IdUsuario
                    ORDER BY fecha_creacion DESC;";
                return Ok(await _db.QueryAsync<NotificacionUsuario>(sql, new { IdUsuario = idUsuario }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo notificaciones");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Obtiene los eventos de auditoría más recientes desde SQL Server.
        /// </summary>
        [HttpGet("auditoria")]
        public async Task<ActionResult<IEnumerable<AuditoriaEvento>>> GetAuditoria()
        {
            try
            {
                const string sql = @"
                    SELECT TOP 80
                        id_evento AS IdEvento,
                        id_usuario_actor AS IdUsuarioActor,
                        modulo AS Modulo,
                        metodo AS Metodo,
                        endpoint AS Endpoint,
                        descripcion AS Descripcion,
                        fecha AS Fecha
                    FROM dbo.AuditoriaEvento
                    ORDER BY fecha DESC, id_evento DESC;";
                return Ok(await _db.QueryAsync<AuditoriaEvento>(sql));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo bitácora de auditoría");
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        /// <summary>
        /// Ejecuta el procedimiento almacenado sp_RecalcularDivisionesEquitativas sobre una cuenta.
        /// </summary>
        [HttpPost("cuentas/{idCuenta}/recalcular")]
        public async Task<IActionResult> RecalcularCuenta(int idCuenta)
        {
            try
            {
                await _db.ExecuteAsync(
                    "EXEC dbo.sp_RecalcularDivisionesEquitativas @IdCuenta;",
                    new { IdCuenta = idCuenta });
                return Ok(new { recalculado = true, idCuenta });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recalculando divisiones de cuenta {IdCuenta}", idCuenta);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }
    }
}
