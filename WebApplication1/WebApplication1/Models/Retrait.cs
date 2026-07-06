using System;
using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Models
{
    public class Retrait
    {
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }
        public Document Document { get; set; }

        [Required]
        public string Reference { get; set; }

        public string EffectuePar { get; set; }

        [Required]
        public string MotifRetrait { get; set; }

        public string Notes { get; set; }

        public DateTime DateRetrait { get; set; } = DateTime.Now;

        public DateTime? DateRetour { get; set; }

        public bool EstAnnule { get; set; } = false;

        public string ServiceArchives { get; set; }
    }
}
