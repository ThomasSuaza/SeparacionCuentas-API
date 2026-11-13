using ApiCQRS.Models;
using ApiCQRS.Models.DTOs;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Interfaces;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace ApiCQRS.Controllers
{
    /// <summary>
    /// Controlador de autenticación y registro contra SQL Server para SplitIA.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioQueries _usuarioQueries;
        private readonly IUsuarioRepository _usuarioRepo;
        private readonly IDbConnection _db;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUsuarioQueries usuarioQueries,
            IUsuarioRepository usuarioRepo,
            IDbConnection db,
            ILogger<AuthController> logger)
        {
            _usuarioQueries = usuarioQueries;
            _usuarioRepo = usuarioRepo;
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Valida credenciales (correo y contraseña) de un usuario o del administrador contra SQL Server.
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                string rawCorreo = (request.Correo ?? string.Empty).Trim().ToLowerInvariant();
                string rawPass = (request.Password ?? string.Empty).Trim();

                if (string.IsNullOrWhiteSpace(rawCorreo) || string.IsNullOrWhiteSpace(rawPass))
                {
                    return BadRequest(new LoginResponse
                    {
                        Autenticado = false,
                        Mensaje = "Debes ingresar tu correo electrónico y contraseña."
                    });
                }

                // Alias amigables para el perfil administrador de SplitIA
                if (rawCorreo == "admin" || rawCorreo == "admin@spliy.ia" || rawCorreo == "admin@correo.com")
                {
                    rawCorreo = "admin@splitia.app";
                }

                var user = await _usuarioQueries.GetByCorreo(rawCorreo);
                if (user == null)
                {
                    return Unauthorized(new LoginResponse
                    {
                        Autenticado = false,
                        Mensaje = "No existe ninguna cuenta registrada con ese correo electrónico."
                    });
                }

                if (!user.Activo)
                {
                    return Unauthorized(new LoginResponse
                    {
                        Autenticado = false,
                        Mensaje = "Esta cuenta se encuentra inactiva. Contacta al administrador."
                    });
                }

                string sha256Pass = ComputeSha256(rawPass);
                string base64Pass = $"HASH_{Convert.ToBase64String(Encoding.UTF8.GetBytes(rawPass))}";

                bool isMatch =
                    string.Equals(user.PasswordHash, sha256Pass, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(user.PasswordHash, base64Pass, StringComparison.Ordinal) ||
                    string.Equals(user.PasswordHash, rawPass, StringComparison.Ordinal);

                if (!isMatch)
                {
                    return Unauthorized(new LoginResponse
                    {
                        Autenticado = false,
                        Mensaje = user.Rol == "ADMIN"
                            ? "Contraseña de Administrador incorrecta."
                            : "Contraseña incorrecta para esta cuenta."
                    });
                }

                await RegistrarAuditoriaAsync(
                    user.IdUsuario,
                    "Auth",
                    "POST",
                    "/api/Auth/login",
                    $"Inicio de sesión exitoso: {user.Correo} ({user.Rol})."
                );

                return Ok(new LoginResponse
                {
                    Autenticado = true,
                    Mensaje = $"Sesión iniciada como {user.Nombre}.",
                    Usuario = new UsuarioResponse
                    {
                        IdUsuario = user.IdUsuario,
                        Nombre = user.Nombre,
                        Correo = user.Correo,
                        Telefono = user.Telefono,
                        Rol = user.Rol,
                        Activo = user.Activo,
                        FechaRegistro = user.FechaRegistro
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en proceso de login");
                return StatusCode(StatusCodes.Status500InternalServerError, new LoginResponse
                {
                    Autenticado = false,
                    Mensaje = "Error interno al verificar credenciales."
                });
            }
        }

        /// <summary>
        /// Registra un nuevo usuario estándar en SplitIA con contraseña cifrada en SHA-256.
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<UsuarioResponse>> Register([FromBody] Usuario payload)
        {
            try
            {
                string correo = (payload.Correo ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(payload.Nombre) || string.IsNullOrWhiteSpace(correo))
                {
                    return BadRequest("El nombre y el correo electrónico son obligatorios.");
                }

                var existing = await _usuarioQueries.GetByCorreo(correo);
                if (existing != null)
                {
                    return Conflict("Ya existe un usuario registrado con ese correo electrónico.");
                }

                string rawPass = string.IsNullOrWhiteSpace(payload.PasswordHash)
                    ? "123456"
                    : payload.PasswordHash.Trim();

                var nuevoUsuario = new Usuario
                {
                    Nombre = payload.Nombre.Trim(),
                    Correo = correo,
                    Telefono = string.IsNullOrWhiteSpace(payload.Telefono) ? null : payload.Telefono.Trim(),
                    PasswordHash = ComputeSha256(rawPass),
                    Rol = "USUARIO",
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };

                var created = await _usuarioRepo.Add(nuevoUsuario);

                // Crear método de pago Nequi inicial si cuenta con teléfono
                await _db.ExecuteAsync(@"
                    INSERT INTO dbo.MetodoPagoUsuario (id_usuario, entidad, numero_cuenta, titular, es_principal)
                    VALUES (@IdUsuario, 'Nequi', @NumeroCuenta, @Titular, 1);",
                    new
                    {
                        created.IdUsuario,
                        NumeroCuenta = created.Telefono ?? "+57 300 000 0000",
                        Titular = created.Nombre
                    });

                await RegistrarAuditoriaAsync(
                    created.IdUsuario,
                    "Auth",
                    "POST",
                    "/api/Auth/register",
                    $"Nuevo usuario registrado en SplitIA: {created.Nombre} ({created.Correo})."
                );

                return StatusCode(StatusCodes.Status201Created, new UsuarioResponse
                {
                    IdUsuario = created.IdUsuario,
                    Nombre = created.Nombre,
                    Correo = created.Correo,
                    Telefono = created.Telefono,
                    Rol = created.Rol,
                    Activo = created.Activo,
                    FechaRegistro = created.FechaRegistro
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registrando usuario en SplitIA");
                return StatusCode(StatusCodes.Status500InternalServerError, "Error al registrar usuario.");
            }
        }

        private async Task RegistrarAuditoriaAsync(
            int? idUsuario,
            string modulo,
            string metodo,
            string endpoint,
            string descripcion)
        {
            const string sql = @"
                INSERT INTO dbo.AuditoriaEvento (id_usuario_actor, modulo, metodo, endpoint, descripcion)
                VALUES (@IdUsuarioActor, @Modulo, @Metodo, @Endpoint, @Descripcion);";

            await _db.ExecuteAsync(sql, new
            {
                IdUsuarioActor = idUsuario,
                Modulo = modulo,
                Metodo = metodo,
                Endpoint = endpoint,
                Descripcion = descripcion
            });
        }

        private static string ComputeSha256(string input)
        {
            using var sha = SHA256.Create();
            byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            var sb = new StringBuilder(bytes.Length * 2);
            foreach (byte b in bytes)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }
    }
}
