using System;

namespace ApiCQRS.Services.Exceptions
{
    /// <summary>
    /// Se lanza cuando una operación incumple una regla de negocio o los datos son inválidos.
    /// La API la traduce a HTTP 400.
    /// </summary>
    public class ReglaNegocioException : Exception
    {
        public ReglaNegocioException(string message) : base(message)
        {
        }
    }
}
