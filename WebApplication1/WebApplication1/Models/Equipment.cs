namespace WebApplication1.Models
{
    public class Equipment
    {
        public int Id { get; set; }
        public string Serial { get; set; }
        public string Code { get; set; }
        public string Type { get; set; }
        public string Etat { get; set; }
        public string Service { get; set; }
        public bool EstCharge { get; set; } = true;
        public DateTime? DateDechargement { get; set; }
        public DateTime DateCreation { get; set; } = DateTime.Now;
    }
}
