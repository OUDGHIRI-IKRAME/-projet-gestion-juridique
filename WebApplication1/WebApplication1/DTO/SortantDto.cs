
namespace WebApplication1.DTO
{
    public class SortantDto
    {
        public string Destinataire { get; set; }      // Destinataire externe
        public string Reference { get; set; }         // Numéro de référence
        public string Objet { get; set; }             // Objet du courrier
        public string TypeSortant { get; set; }       // "normal" ou "demande"
        public DateTime? DateEnvoi { get; set; }      // Optionnel
        public string? NumeroEnvoi { get; set; }      // Optionnel
        public string? TribunalOrigine { get; set; }   // Tribunal d'origine
        public string? TribunalDestination { get; set; } // Tribunal de destination
    }
}