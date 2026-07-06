namespace WebApplication1.Models
{
    public class Utilisateur
    {
        public int Id { get; set; }
        public string Login { get; set; }
        public string PasswordHash { get; set; }
        public string Nom { get; set; }
        public string Role { get; set; }
        public string Service { get; set; }
    }
}