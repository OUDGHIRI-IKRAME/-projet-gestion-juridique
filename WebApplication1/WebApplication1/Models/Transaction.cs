using System;

namespace WebApplication1.Models
{
    public class Transaction
    {
        public int Id { get; set; }

        public int DocumentId { get; set; }
        public Document Document { get; set; }

        public ServiceTribunal ServiceOrigine { get; set; }
        public ServiceTribunal ServiceDestination { get; set; }

        public DateTime DateTransaction { get; set; } = DateTime.Now;
        public string? Remarques { get; set; }
        public string? UtilisateurId { get; set; }
        public int? CourrierAdminId { get; set; }
        public string? StatutEtape { get; set; }
        public int? ServiceDestinataireId { get; set; }
        public int? AgentDestinataireId { get; set; }
        public string? NomPersonneExterne { get; set; }

        public StatutTransaction Statut { get; set; } = StatutTransaction.EnAttente;
        public string? Commentaire { get; set; }
        public string? MotifRefus { get; set; }
        public bool DoitRevenir { get; set; }
    }
}
