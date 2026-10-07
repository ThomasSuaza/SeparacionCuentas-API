using System;

namespace ApiCQRS.Services.Exceptions
{
    /// <summary>
    /// Se lanza cuando un recurso referenciado no existe (usuario, cuenta, división...).
    /// La API la traduce a HTTP 404.
    /// </summary>
    public class RecursoNoEncontradoException : Exception
    {
        public RecursoNoEncontradoException(string message) : base(message)
        {
        }
    }
}
