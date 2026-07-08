using System;

namespace WebApplication1.Models
{
    public class CourrierAdministratif : Document
    {
        public string NumeroOrdre { get; set; }
        public string Expediteur { get; set; }
        public DateTime DateReception { get; set; } = DateTime.Now;
        public string TypeCircuit { get; set; }
        public bool Transmissible { get; set; } = true;
    }
}