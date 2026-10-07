using ApiCQRS.Services.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace ApiCQRS.Middleware
{
    /// <summary>
    /// Traduce las excepciones de negocio de la capa Services a respuestas HTTP:
    /// ReglaNegocioException -> 400, RecursoNoEncontradoException -> 404.
    /// Cualquier otra excepción sigue su curso normal (500).
    /// </summary>
    public class ManejoErroresMiddleware
    {
        private readonly RequestDelegate _next;

        public ManejoErroresMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ReglaNegocioException ex)
            {
                await Responder(context, StatusCodes.Status400BadRequest, "Solicitud inválida", ex.Message);
            }
            catch (RecursoNoEncontradoException ex)
            {
                await Responder(context, StatusCodes.Status404NotFound, "Recurso no encontrado", ex.Message);
            }
        }

        private static async Task Responder(HttpContext context, int status, string titulo, string detalle)
        {
            context.Response.Clear();
            context.Response.StatusCode = status;

            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = status,
                Title = titulo,
                Detail = detalle
            });
        }
    }
}
