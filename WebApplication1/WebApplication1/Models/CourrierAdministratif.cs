using System;

namespace WebApplication1.Models
{
    public class CourrierAdministratif : Document
    {
        // Propriétés SPECIFIQUES au courrier administratif (NON présentes dans Document)
        public string NumeroOrdre { get; set; }        // Spécifique
        public string Expediteur { get; set; }         // Spécifique
        public DateTime DateReception { get; set; } = DateTime.Now; // Spécifique
        public string TypeCircuit { get; set; }        // Spécifique (kitaba_khasa, archivage, etc.)
        public string? FilePath { get; set; }          // Spécifique
    }
}