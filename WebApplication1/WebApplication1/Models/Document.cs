using System;
using System.Collections.Generic;

namespace WebApplication1.Models
{
    public class Document
    {
        public int Id { get; set; }

        // C'est d'ici que CourrierAdministratif tire ces informations :
        public string NumeroReference { get; set; }
        public string Sujet { get; set; }
        public DateTime DateCreation { get; set; } = DateTime.Now;

        public ServiceTribunal ServiceActuel { get; set; }
        public StatutDossier StatutActuel { get; set; }

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        public string NumeroBureauOrdre { get; set; }
        public string Objet { get; set; }

        // Suppression logique
        public bool EstSupprime { get; set; } = false;
    }

}