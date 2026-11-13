using Dapper.Contrib.Extensions;

namespace ApiCQRS.Models
{
    /// <summary>
    /// Desglose de ítem o consumo individual asociado a una cuenta compartida.
    /// </summary>
    [Table("ItemConsumo")]
    public class ItemConsumo
    {
        /// <summary>Identificador único del ítem.</summary>
        [Key]
        public int IdItem { get; set; }

        /// <summary>Identificador de la cuenta asociada.</summary>
        public int IdCuenta { get; set; }

        /// <summary>Concepto del gasto o producto.</summary>
        public string Concepto { get; set; } = string.Empty;

        /// <summary>Descripción adicional o cantidad.</summary>
        public string? Detalle { get; set; }

        /// <summary>Valor monetario del ítem.</summary>
        public decimal Valor { get; set; }

        /// <summary>Icono o etiqueta visual del ítem.</summary>
        public string Icono { get; set; } = "🧾";
    }
}
